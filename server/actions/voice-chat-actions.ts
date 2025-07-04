"use server"

import { AGENT_PREFIX } from "@/constants"
import { Signer } from "@volcengine/openapi"
import { RequestObj } from "@volcengine/openapi/lib/base/types"
import { v4 as uuidv4 } from "uuid"

// Volcengine API 配置
const VOLCENGINE_API_BASE = "https://rtc.volcengineapi.com"

const API_VERSION = "2024-12-01"


// 启动智能体的配置接口
interface StartVoiceChatConfig {
  appId: string
  roomId: string
  targetUserId: string
  systemMessage?: string
  welcomeMessage?: string
  asr?: {
    appId: string
    accessToken: string
    cluster: string
    mode: string
  }
  tts?: {
    appId: string
    accessToken: string
    voiceType: string
    speechRate: number
    pitchRate: number
  }
  llm?: {
    endpointId: string
    temperature: number
    maxTokens: number
    topP: number
  }
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
  Result?: "ok" | null
  Error?: {
    Code: string
    Message: string
  }
}

/**
 * 创建 Volcengine API 认证头
 */
async function createAuthHeaders(
  action: string,
  version: string,
  body: Record<string, unknown>
): Promise<Record<string, string>> {

  const accessKey = process.env.VOLCENGINE_ACCESS_KEY
  const secretKey = process.env.VOLCENGINE_SECRET_KEY

  if (!accessKey || !secretKey) {
    throw new Error("Missing VOLCENGINE_ACCESS_KEY or VOLCENGINE_SECRET_KEY")
  }

  const openApiRequestData: RequestObj = {
    region: "cn-north-1",
    method: "POST",
    params: {
      Action: action,
      Version: version,
    },
    headers: {
      Host: "rtc.volcengineapi.com",
      "Content-type": "application/json",
    },
    body,
  }

  const signer = new Signer(openApiRequestData, "rtc")
  signer.addAuthorization({
    accessKeyId: accessKey,
    secretKey: secretKey,
  })

  return openApiRequestData.headers
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

    // 构建请求体
    const requestBody = {
      AppId: config.appId,
      RoomId: config.roomId,
      TaskId: taskId,
      Config: {
        ASRConfig: {
          Provider: "volcano",
          ProviderParams: {
            Mode: config.asr?.mode || "bigmodel",
            AppId: config.asr?.appId || process.env.VOLCENGINE_ASR_APP_ID || "94****11",
            AccessToken: config.asr?.accessToken || process.env.VOLCENGINE_ASR_ACCESS_TOKEN || "OaO****ws1",
            ApiResourceId: "volc.bigasr.sauc.duration",
            StreamMode: 0,
            Cluster: config.asr?.cluster,
          },
          VolumeGain: 0.3,
          InterruptConfig: {
            InterruptSpeechDuration: 500,
            InterruptKeywords: ["停止", "停下", "打住"],
          },
          TurnDetectionMode: 0,
        },
        TTSConfig: {
          Provider: "volcano_bidirection",
          ProviderParams: {
            app: {
              appid: config.tts?.appId || process.env.VOLCENGINE_TTS_APP_ID || "94****11",
              token: config.tts?.accessToken || process.env.VOLCENGINE_TTS_ACCESS_TOKEN || "volcano_tts",
            },
            audio: {
              voice_type: config.tts?.voiceType || "zh_male_qingshuangnanda_mars_bigtts",
              speech_rate: config.tts?.speechRate || 0,
              pitch_rate: config.tts?.pitchRate || 0,
            },
            ResourceId: "volc.service_type.10029",
          },
          IgnoreBracketText: [1, 2], // 过滤中英文括号内容
        },
        LLMConfig: {
          Mode: "ArkV3", // 使用火山方舟平台
          EndPointId: config.llm?.endpointId || process.env.VOLCENGINE_ENDPOINT_ID || "ep-22****212",
          Temperature: config.llm?.temperature || 0.7,
          MaxTokens: config.llm?.maxTokens || 1024,
          TopP: config.llm?.topP || 0.8,
          SystemMessages: [
            config.systemMessage || "你是一个友好的AI助手，用简洁明了的方式回答问题。",
            "请用自然、口语化的方式对话，每次回复控制在100字以内。",
          ],
          HistoryLength: 5,
          Prefill: true,
          UserPrompts: [
            {
              Role: "user",
              Content: "你好",
            },
            {
              Role: "assistant",
              Content: "有什么可以帮到你的？",
            },
          ],
        },
        SubtitleConfig: {
          DisableRTSSubtitle: false,
          SubtitleMode: 0,
        },
        InterruptMode: 0, // 开启语音打断
      },
      AgentConfig: {
        TargetUserId: [config.targetUserId],
        WelcomeMessage: config.welcomeMessage || "你好！我是你的AI助手，有什么可以帮助你的吗？",
        UserId: `${AGENT_PREFIX}${taskId}`,
        EnableConversationStateCallback: true,
      },
    }

    console.log("Starting voice chat with config:", JSON.stringify({ config, requestBody, taskId }, null, 2))

    // 构建API URL
    const url = `${VOLCENGINE_API_BASE}?Action=StartVoiceChat&Version=${API_VERSION}`

    // 获取认证信息
    const headers = await createAuthHeaders("StartVoiceChat", API_VERSION, requestBody)

    // 发送请求
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    })

    const result = (await response.json()) as unknown as VoiceChatApiResponse

    console.log("Voice chat API response:", result)

    if (result.Result === "ok") {
      return {
        success: true,
        taskId,
      }
    } else {
      return {
        success: false,
        error: result.Error?.Message || "启动智能体失败",
      }
    }
  } catch (error) {
    console.error("Error starting voice chat:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误",
    }
  }
}

/**
 * 停止AI语音聊天智能体
 */
export async function stopVoiceChat(
  appId: string,
  roomId: string,
  taskId: string
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    console.log("Stopping voice chat with taskId:", taskId)

    // 构建请求体
    const requestBody = {
      AppId: appId,
      RoomId: roomId,
      TaskId: taskId,
    }

    // 构建API URL
    const url = `${VOLCENGINE_API_BASE}?Action=StopVoiceChat&Version=${API_VERSION}`

    // 获取认证信息
    const headers = await createAuthHeaders("StopVoiceChat", API_VERSION, requestBody)

    // 发送请求
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    })

    const result = (await response.json()) as VoiceChatApiResponse

    console.log("Stop voice chat API response:", result)

    if (result.Result === "ok") {
      return {
        success: true,
      }
    } else {
      return {
        success: false,
        error: result.Error?.Message || "停止智能体失败",
      }
    }
  } catch (error) {
    console.error("Error stopping voice chat:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误",
    }
  }
}

/**
 * 获取语音聊天任务状态
 */
export async function getVoiceChatStatus(
  appId: string,
  taskId: string
): Promise<{
  success: boolean
  status?: "running" | "stopped" | "error"
  error?: string
}> {
  try {
    console.log("Getting voice chat status for taskId:", taskId)

    // 构建请求体
    const requestBody = {
      AppId: appId,
      TaskId: taskId,
    }

    // 构建API URL
    const url = `${VOLCENGINE_API_BASE}?Action=GetVoiceChatStatus&Version=${API_VERSION}`

    // 获取认证信息
    const headers = await createAuthHeaders("GetVoiceChatStatus", API_VERSION, requestBody)

    // 发送请求
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    })

    const result = (await response.json()) as unknown as VoiceChatApiResponse

    console.log("Voice chat status API response:", result)

    if (response.ok) {
      return {
        success: true,
        status: "running", // 实际情况下需要根据API响应解析状态
      }
    } else {
      return {
        success: false,
        error: result.Error?.Message || "获取状态失败",
      }
    }
  } catch (error) {
    console.error("Error getting voice chat status:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误",
    }
  }
}
