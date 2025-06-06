'use server'

import { v4 as uuidv4 } from 'uuid'

// Volcengine API 配置
const VOLCENGINE_API_BASE = 'https://rtc.volcengineapi.com'
const API_VERSION = '2024-12-01'

// 启动智能体的配置接口
interface StartVoiceChatConfig {
  appId: string
  roomId: string
  targetUserId: string
  systemMessage?: string
  welcomeMessage?: string
}

// 启动智能体响应接口
interface VoiceChatApiResponse {
  ResponseMetadata: {
    RequestId: string
    Action: string
    Version: string
    Service: string
    Region: string
  }
  Result?: 'ok' | null
  Error?: {
    Code: string
    Message: string
  }
}

/**
 * 生成火山引擎API签名
 * TODO: 实现真实的AWS v4签名算法
 */
function _generateSignature(
  _secretKey: string,
  _region: string,
  _service: string,
  _date: string,
  _signedHeaders: string,
  _canonicalRequest: string
): string {
  // 这里需要实现真实的AWS v4签名算法
  // 为了演示，返回一个占位符
  return 'placeholder-signature'
}

/**
 * 创建火山引擎API认证头
 */
function createAuthHeaders(
  accessKey: string,
  secretKey: string,
  region: string = 'cn-north-1',
  service: string = 'rtc'
) {
  const now = new Date()
  const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '')
  const timeStamp = now.toISOString().slice(0, 19).replace(/[-:]/g, '') + 'Z'
  
  // 简化的认证头，实际使用时需要完整的AWS v4签名
  return {
    'Authorization': `VOLC-HMAC-SHA256 Credential=${accessKey}/${dateStamp}/${region}/${service}/volc_request`,
    'X-Date': timeStamp,
    'Content-Type': 'application/json',
    'Host': 'rtc.volcengineapi.com'
  }
}

/**
 * 启动AI语音聊天智能体
 */
export async function startVoiceChat(config: StartVoiceChatConfig): Promise<{
  success: boolean
  taskId?: string
  error?: string
}> {
  try {
    // 生成唯一的任务ID
    const taskId = uuidv4()
    
    console.log('Starting voice chat with config:', { ...config, taskId })
    
    // 构建请求体
    const requestBody = {
      AppId: config.appId,
      RoomId: config.roomId,
      TaskId: taskId,
      Config: {
        ASRConfig: {
          Provider: 'volcengine',
          ProviderParams: {
            app: {
              appid: process.env.VOLCENGINE_ASR_APP_ID || '94****11',
              token: process.env.VOLCENGINE_ASR_TOKEN || 'OaO****ws1',
              cluster: process.env.VOLCENGINE_ASR_CLUSTER || 'volcano_asr'
            },
            audio: {
              encoding: 'pcm',
              rate: 16000,
              channel: 1,
              bits: 16
            }
          },
          ResourceId: 'volc.service_type.10002',
          VolumeGain: 0.3,
          InterruptConfig: {
            InterruptSpeechDuration: 500,
            InterruptKeywords: ['停止', '停下', '打住']
          },
          TurnDetectionMode: 0
        },
        TTSConfig: {
          Provider: 'volcano',
          ProviderParams: {
            app: {
              appid: process.env.VOLCENGINE_TTS_APP_ID || '94****11',
              cluster: process.env.VOLCENGINE_TTS_CLUSTER || 'volcano_tts'
            },
            audio: {
              voice_type: 'BV001_streaming',
              speed_ratio: 1.0,
              volume_ratio: 1.0,
              pitch_ratio: 1.0
            }
          },
          IgnoreBracketText: [1, 2] // 过滤中英文括号内容
        },
        LLMConfig: {
          Mode: 'ArkV3', // 使用火山方舟平台
          EndPointId: process.env.VOLCENGINE_ENDPOINT_ID || 'ep-22****212',
          Temperature: 0.7,
          MaxTokens: 1024,
          TopP: 0.8,
          SystemMessages: [
            config.systemMessage || '你是一个友好的AI助手，用简洁明了的方式回答问题。',
            '请用自然、口语化的方式对话，每次回复控制在100字以内。'
          ],
          HistoryLength: 5,
          Prefill: false
        },
        SubtitleConfig: {
          DisableRTSSubtitle: false,
          SubtitleMode: 0
        },
        InterruptMode: 0, // 开启语音打断
        AgentConfig: {
          TargetUserId: [config.targetUserId],
          WelcomeMessage: config.welcomeMessage || '你好！我是你的AI助手，有什么可以帮助你的吗？',
          UserId: `voice_agent_${taskId}`,
          EnableConversationStateCallback: true
        }
      }
    }
    
    // 构建API URL
    const url = `${VOLCENGINE_API_BASE}?Action=StartVoiceChat&Version=${API_VERSION}`
    
    // 获取认证信息
    const accessKey = process.env.VOLCENGINE_ACCESS_KEY
    const secretKey = process.env.VOLCENGINE_SECRET_KEY
    
    if (!accessKey || !secretKey) {
      throw new Error('火山引擎认证信息未配置')
    }
    
    // 创建认证头
    const headers = createAuthHeaders(accessKey, secretKey)
    
    // 发送请求
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    })
    
    const result = await response.json() as unknown as VoiceChatApiResponse
    
    console.log('Voice chat API response:', result)
    
    if (result.Result === 'ok') {
      return {
        success: true,
        taskId
      }
    } else {
      return {
        success: false,
        error: result.Error?.Message || '启动智能体失败'
      }
    }
  } catch (error) {
    console.error('Error starting voice chat:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}

/**
 * 停止AI语音聊天智能体
 */
export async function stopVoiceChat(appId: string, taskId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    console.log('Stopping voice chat with taskId:', taskId)
    
    // 构建请求体
    const requestBody = {
      AppId: appId,
      TaskId: taskId
    }
    
    // 构建API URL
    const url = `${VOLCENGINE_API_BASE}?Action=StopVoiceChat&Version=${API_VERSION}`
    
    // 获取认证信息
    const accessKey = process.env.VOLCENGINE_ACCESS_KEY
    const secretKey = process.env.VOLCENGINE_SECRET_KEY
    
    if (!accessKey || !secretKey) {
      throw new Error('火山引擎认证信息未配置')
    }
    
    // 创建认证头
    const headers = createAuthHeaders(accessKey, secretKey)
    
    // 发送请求
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    })
    
    const result = await response.json() as VoiceChatApiResponse
    
    console.log('Stop voice chat API response:', result)
    
    if (result.Result === 'ok') {
      return {
        success: true
      }
    } else {
      return {
        success: false,
        error: result.Error?.Message || '停止智能体失败'
      }
    }
  } catch (error) {
    console.error('Error stopping voice chat:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}

/**
 * 获取语音聊天任务状态
 */
export async function getVoiceChatStatus(appId: string, taskId: string): Promise<{
  success: boolean
  status?: 'running' | 'stopped' | 'error'
  error?: string
}> {
  try {
    console.log('Getting voice chat status for taskId:', taskId)
    
    // 构建请求体
    const requestBody = {
      AppId: appId,
      TaskId: taskId
    }
    
    // 构建API URL
    const url = `${VOLCENGINE_API_BASE}?Action=GetVoiceChatStatus&Version=${API_VERSION}`
    
    // 获取认证信息
    const accessKey = process.env.VOLCENGINE_ACCESS_KEY
    const secretKey = process.env.VOLCENGINE_SECRET_KEY
    
    if (!accessKey || !secretKey) {
      throw new Error('火山引擎认证信息未配置')
    }
    
    // 创建认证头
    const headers = createAuthHeaders(accessKey, secretKey)
    
    // 发送请求
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    })
    
    const result = await response.json() as unknown as VoiceChatApiResponse
    
    console.log('Voice chat status API response:', result)
    
    if (response.ok) {
      return {
        success: true,
        status: 'running' // 实际情况下需要根据API响应解析状态
      }
    } else {
      return {
        success: false,
        error: result.Error?.Message || '获取状态失败'
      }
    }
  } catch (error) {
    console.error('Error getting voice chat status:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}
