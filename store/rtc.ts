"use client"

import VERTC, { IRTCEngine, MediaType, RoomProfileType } from '@volcengine/rtc'
import { atom } from 'jotai'
import type { Getter, Setter } from 'jotai'
import { atomWithStorage } from "jotai/utils"

import { startVoiceChat, stopVoiceChat } from '@/lib/voice-chat-actions'

// 消息类型枚举
export enum MESSAGE_TYPE {
  BRIEF = 'conv',
  SUBTITLE = 'subtitle', 
  FUNCTION_CALL = 'tool',
}

// 智能体状态码
export enum AGENT_BRIEF {
  THINKING = 'thinking',
  SPEAKING = 'speaking', 
  FINISHED = 'finished',
  INTERRUPTED = 'interrupted',
}

// 消息类型定义
interface AgentBriefMessage {
  Stage?: {
    Code: string
    Description?: string
  }
}

/**
 * @example
 * ```json  
 * {
    "definite": false,
    "language": "",
    "mode": 1,
    "paragraph": false,
    "sequence": 49,
    "text": "有啥事儿尽管说，中文英",
    "timestamp": 1749234040654,
    "userId": "voice_agent_a8d496ec-139f-4ade-b868-90f293adca56"
  }
 * ```
 */
interface SubtitleData {
  text: string
  definite: boolean
  userId: string
  paragraph: boolean
  language: string
  mode: number
  sequence: number
  timestamp: number
}

interface SubtitleMessage {
  data?: SubtitleData[]
}

// TLV 解析工具
class MessageParser {
  static tlv2String(tlvBuffer: ArrayBuffer) {
    try {
      if (!tlvBuffer || tlvBuffer.byteLength < 8) {
        throw new Error('Invalid TLV buffer')
      }
      
      const dataView = new DataView(tlvBuffer)
      const type = dataView.getUint32(0, false) // big-endian
      const length = dataView.getUint32(4, false) // big-endian
      
      if (length === undefined || length < 0) {
        throw new Error('Invalid TLV length')
      }
      
      if (tlvBuffer.byteLength < 8 + length) {
        throw new Error('Buffer too small for declared length')
      }
      
      const valueBuffer = tlvBuffer.slice(8, 8 + length)
      const decoder = new TextDecoder('utf-8')
      const value = decoder.decode(valueBuffer)
      
      return {
        type: type.toString(),
        value: value
      }
    } catch (error) {
      console.error('TLV 解析失败:', error)
      throw error
    }
  }
}

// RTC 配置
export interface RTCConfig {
  appId: string
  roomId: string
  uid: string
  token: string
}

// RTC 状态
export interface RTCState {
  engine: IRTCEngine | null
  isConnected: boolean
  isLocalAudioEnabled: boolean
  isRemoteAudioEnabled: boolean
  remoteUsers: string[]
  error: string | null
}

// AI 语音聊天状态类型
export interface VoiceChatState {
  isAgentActive: boolean
  taskId: string | null
  agentUserId: string | null
  error: string | null
  isStarting: boolean
  isStopping: boolean
  subtitle?: {
    text: string
    userId: string
    isDefinite: boolean
    timestamp: number
  }
  agentStatus?: {
    isThinking: boolean
    isTalking: boolean
    lastUpdate: number
  }
}

export const defaultRTCConfig: RTCConfig = {
  appId: "",
  roomId: "Room123",
  uid: "User123",
  token: ""
}

// 初始状态
export const rtcConfigAtom = atomWithStorage<RTCConfig>("rtcConfig", defaultRTCConfig, undefined, {getOnInit: true})
export const rtcStateAtom = atom<RTCState>({
  engine: null,
  isConnected: false,
  isLocalAudioEnabled: false,
  isRemoteAudioEnabled: false,
  remoteUsers: [],
  error: null
})
export const voiceChatStateAtom = atom<VoiceChatState>({
  isAgentActive: false,
  taskId: null,
  agentUserId: null,
  error: null,
  isStarting: false,
  isStopping: false
})

// RTC 操作原子
export const rtcActionsAtom = atom(null, (get: Getter, set: Setter, action: RTCAction) => {
  const state = get(rtcStateAtom)
  const config = get(rtcConfigAtom)
  const voiceChatState = get(voiceChatStateAtom)

  switch (action.type) {
    case 'INITIALIZE_ENGINE':
      if (!config?.appId) {
        set(rtcStateAtom, { ...state, error: 'AppID is required' })
        return
      }
      
      try {
        const engine = VERTC.createEngine(config.appId)
        
        // 监听事件
        engine.on(VERTC.events.onUserPublishStream, (e: {
          userId: string
          mediaType: MediaType
        }) => {
          console.log('用户发布流:', e.userId)
          const currentState = get(rtcStateAtom)
          if (!currentState.remoteUsers.includes(e.userId)) {
            set(rtcStateAtom, {
              ...currentState,
              remoteUsers: [...currentState.remoteUsers, e.userId]
            })
          }
        })
        
        engine.on(VERTC.events.onUserUnpublishStream, (e: {
          userId: string
          mediaType: MediaType
        }) => {
          console.log('用户取消发布流:', e.userId)
          const currentState = get(rtcStateAtom)
          set(rtcStateAtom, {
            ...currentState,
            remoteUsers: currentState.remoteUsers.filter(id => id !== e.userId)
          })
        })
        
        engine.on(VERTC.events.onUserJoined, (e: { userInfo: { userId: string } }) => {
          console.log('用户加入房间:', e.userInfo.userId)
        })
        
        engine.on(VERTC.events.onUserLeave, (e: { userInfo: { userId: string } }) => {
          console.log('用户离开房间:', e.userInfo.userId)
        })
        
        // 处理房间二进制消息 - AI智能体实时数据
        engine.on(VERTC.events.onRoomBinaryMessageReceived, (e: { userId: string; message: ArrayBuffer }) => {
          handleRoomBinaryMessageReceived(e, set, get)
        })
        
        set(rtcStateAtom, { ...state, engine, error: null })
      } catch (error) {
        console.error('初始化引擎失败:', error)
        set(rtcStateAtom, { ...state, error: `初始化引擎失败: ${error}` })
      }
      break
      
    case 'JOIN_ROOM':
      console.log('加入房间:', config)
      if (!state.engine || !config) {
        set(rtcStateAtom, { ...state, error: '引擎未初始化或配置缺失' })
        return
      }
      
      state.engine.joinRoom(
        config.token,
        config.roomId,
        { userId: config.uid },
        {
          isAutoPublish: true,
          isAutoSubscribeAudio: true,
          isAutoSubscribeVideo: false,
          roomProfileType: RoomProfileType.communication
        }
      ).then(() => {
        set(rtcStateAtom, { ...state, isConnected: true, error: null })
      }).catch((error) => {
        set(rtcStateAtom, { ...state, error: `加入房间失败: ${error.message}` })
      })
      break
      
    case 'LEAVE_ROOM':
      console.log('离开房间')
      if (state.engine && state.isConnected) {
        try {
          // 如果 AI 智能体正在运行，先停止它
          if (voiceChatState.isAgentActive && voiceChatState.taskId) {
            console.log('停止 AI 智能体')
            set(rtcActionsAtom, { type: 'STOP_VOICE_CHAT' })
          }
          
          state.engine.leaveRoom().then(() => {
            set(rtcStateAtom, {
              ...state,
              isConnected: false,
              isLocalAudioEnabled: false,
              isRemoteAudioEnabled: false,
              remoteUsers: [],
              error: null
            })
          }).catch((error) => {
            set(rtcStateAtom, { ...state, error: `离开房间失败: ${error.message}` })
          })
        } catch (error) {
          console.error('离开房间失败:', error)
          set(rtcStateAtom, { ...state, error: `离开房间失败: ${error}` })
        }
      }
      break
      
    case 'START_LOCAL_AUDIO':
      if (!state.engine) {
        set(rtcStateAtom, { ...state, error: '引擎未初始化' })
        return
      }

      const audioEngine = state.engine
      audioEngine.publishStream(MediaType.AUDIO).then(() => {
        console.log('发布音频流成功') 
        return audioEngine.startAudioCapture()
      }).then(() => {
        console.log('启动音频采集成功')
        set(rtcStateAtom, { ...state, isLocalAudioEnabled: true, error: null })
      }).catch((error) => {
        console.error('启动音频采集失败:', error)
        set(rtcStateAtom, { ...state, error: `启动音频采集失败: ${error.message}` })
      })
      break
      
    case 'STOP_LOCAL_AUDIO':
      console.log('停止音频采集')
      if (!state.engine) return
      
      state.engine.stopAudioCapture()
      set(rtcStateAtom, { ...state, isLocalAudioEnabled: false })
      break
      
    case 'START_VOICE_CHAT':
      console.log('启动 AI 语音聊天')
      if (state.isConnected && !voiceChatState.isAgentActive && !voiceChatState.isStarting) {
        set(voiceChatStateAtom, (prev) => ({
          ...prev,
          isStarting: true,
          error: null
        }))
        
        startVoiceChat({
          appId: config.appId,
          roomId: config.roomId,
          targetUserId: config.uid,
          systemMessage: action.systemMessage,
          welcomeMessage: action.welcomeMessage
        }).then((result) => {
          if (result.success && result.taskId) {
            console.log('启动 AI 语音聊天成功')
            set(voiceChatStateAtom, (prev) => ({
              ...prev,
              isAgentActive: true,
              taskId: result.taskId || null,
              agentUserId: `voice_agent_${result.taskId}`,
              isStarting: false,
              error: null
            }))
          } else {
            console.error('启动 AI 语音聊天失败:', result.error)
            set(voiceChatStateAtom, (prev) => ({
              ...prev,
              isStarting: false,
              error: result.error || '启动智能体失败'
            }))
          }
        }).catch((error) => {
          console.error('启动 AI 语音聊天失败:', error)
          set(voiceChatStateAtom, (prev) => ({
            ...prev,
            isStarting: false,
            error: error instanceof Error ? error.message : '启动智能体失败'
          }))
        })
      }
      break
      
    case 'STOP_VOICE_CHAT':
      console.log('停止 AI 语音聊天')
      if (voiceChatState.isAgentActive && voiceChatState.taskId && !voiceChatState.isStopping) {
        set(voiceChatStateAtom, (prev) => ({
          ...prev,
          isStopping: true,
          error: null
        }))
        
        stopVoiceChat(config.appId, config.roomId, voiceChatState.taskId).then((result) => {
          if (result.success) {
            console.log('停止 AI 语音聊天成功')
            set(voiceChatStateAtom, (prev) => ({
              ...prev,
              isAgentActive: false,
              taskId: null,
              agentUserId: null,
              isStopping: false,
              error: null
            }))
          } else {
            console.error('停止 AI 语音聊天失败:', result.error)
            set(voiceChatStateAtom, (prev) => ({
              ...prev,
              isStopping: false,
              error: result.error || '停止智能体失败'
            }))
          }
        }).catch((error) => {
          console.error('停止 AI 语音聊天失败:', error)
          set(voiceChatStateAtom, (prev) => ({
            ...prev,
            isStopping: false,
            error: error instanceof Error ? error.message : '停止智能体失败'
          }))
        })
      }
      break
      
    case 'SET_ERROR':
      console.log('设置错误:', action.payload)
      set(rtcStateAtom, { ...state, error: action.payload })
      break
      
    case 'CLEAR_ERROR':
      console.log('清除错误')
      set(rtcStateAtom, { ...state, error: null })
      break
  }
})

// 操作类型定义
export type RTCAction = 
  | { type: 'INITIALIZE_ENGINE' }
  | { type: 'JOIN_ROOM' }
  | { type: 'LEAVE_ROOM' }
  | { type: 'START_LOCAL_AUDIO' }
  | { type: 'STOP_LOCAL_AUDIO' }
  | { type: 'START_VOICE_CHAT'; systemMessage?: string; welcomeMessage?: string }
  | { type: 'STOP_VOICE_CHAT' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }

// 处理房间二进制消息
function handleRoomBinaryMessageReceived(
  e: { userId: string; message: ArrayBuffer }, 
  set: Setter, 
  get: Getter
) {
  try {
    const { type, value } = MessageParser.tlv2String(e.message)
    const parsed = JSON.parse(value) as {type: string, data: unknown}
    
    console.log('收到房间消息:', { userId: e.userId, type, parsed })

    switch (parsed.type as MESSAGE_TYPE) {
      case MESSAGE_TYPE.BRIEF:
        // 处理智能体状态变化
        handleAgentBrief(parsed as AgentBriefMessage, set, get)
        break
        
      case MESSAGE_TYPE.SUBTITLE:
        // 处理字幕数据
        handleSubtitleMessage(parsed.data as SubtitleMessage, set, get)
        break
        
      case MESSAGE_TYPE.FUNCTION_CALL:
        // 处理函数调用（暂时记录）
        console.log('收到函数调用消息:', parsed)
        break
        
      default:
        console.log('未知消息类型:', type, parsed)
    }
  } catch (error) {
    console.error('解析房间二进制消息失败:', error)
  }
}

// 处理智能体状态变化
function handleAgentBrief(
  parsed: AgentBriefMessage, 
  set: Setter, 
  get: Getter
) {
  const { Stage } = parsed || {}
  const { Code, Description } = Stage || {}
  
  if (!Code) return
  
  const currentState = get(voiceChatStateAtom)
  const now = Date.now()
  
  const newAgentStatus = {
    isThinking: false,
    isTalking: false,
    lastUpdate: now
  }
  
  switch (Code) {
    case AGENT_BRIEF.THINKING:
      newAgentStatus.isThinking = true
      console.log('AI智能体思考中...', Description)
      break
      
    case AGENT_BRIEF.SPEAKING:
      newAgentStatus.isTalking = true
      console.log('AI智能体开始说话...', Description)
      break
      
    case AGENT_BRIEF.FINISHED:
      console.log('AI智能体结束说话', Description)
      break
      
    case AGENT_BRIEF.INTERRUPTED:
      console.log('AI智能体被打断', Description)
      break
      
    default:
      console.log('未知智能体状态:', Code, Description)
      return
  }
  
  set(voiceChatStateAtom, {
    ...currentState,
    agentStatus: newAgentStatus
  })
}

// 处理字幕消息
function handleSubtitleMessage(
  parsed: SubtitleMessage, 
  set: Setter, 
  get: Getter
) {
  const data = parsed.data?.[0]
  if (!data) return
  
  const { text, definite, userId, paragraph } = data
  
  if (text) {
    const currentState = get(voiceChatStateAtom)
    
    set(voiceChatStateAtom, {
      ...currentState,
      subtitle: {
        text,
        userId: userId || 'unknown',
        isDefinite: !!definite,
        timestamp: Date.now()
      }
    })
    
    console.log('收到字幕:', { text, userId, definite, paragraph })
  }
}
