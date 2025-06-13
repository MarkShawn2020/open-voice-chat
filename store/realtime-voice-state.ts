// 端到端实时语音大模型状态管理
import { RealtimeVoiceClient, ServerEventType } from "@/lib/realtime-voice-service"
import { appConfigAtom } from "@/store/app-config"
import { atom } from "jotai"
import { atomWithStorage } from "jotai/utils"

export interface RealtimeVoiceMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: number
  isInterim: boolean // 是否为临时结果
  audioUrl?: string // 音频URL (for TTS response)
}

export interface RealtimeVoiceState {
  // 连接状态
  isConnected: boolean
  isConnecting: boolean
  
  // 会话状态
  isSessionActive: boolean
  isStartingSession: boolean
  sessionId: string | null
  
  // 语音状态
  isRecording: boolean
  isSpeaking: boolean // AI是否在说话
  isThinking: boolean // AI是否在思考
  
  // 消息和音频
  messages: RealtimeVoiceMessage[]
  currentAudioUrl: string | null // 当前播放的音频URL
  
  // 实时字幕
  userTranscript: string // 用户实时语音识别结果
  assistantText: string // AI实时文本回复
  
  // 错误状态
  error: string | null
  
  // 客户端实例
  client: RealtimeVoiceClient | null
}

// 默认状态
const defaultState: RealtimeVoiceState = {
  isConnected: false,
  isConnecting: false,
  isSessionActive: false,
  isStartingSession: false,
  sessionId: null,
  isRecording: false,
  isSpeaking: false,
  isThinking: false,
  messages: [],
  currentAudioUrl: null,
  userTranscript: "",
  assistantText: "",
  error: null,
  client: null,
}

// 状态原子
export const realtimeVoiceStateAtom = atomWithStorage<RealtimeVoiceState>(
  "realtimeVoiceState", 
  defaultState,
  undefined,
  { getOnInit: false }
)

// 当前会话消息原子 (计算属性)
export const currentRealtimeMessagesAtom = atom((get) => {
  const state = get(realtimeVoiceStateAtom)
  const sessionId = state.sessionId
  
  if (!sessionId) return []
  
  return state.messages.filter(message => 
    message.id.startsWith(`${sessionId}-`)
  )
})

// 操作类型定义
export type RealtimeVoiceAction =
  | { type: "CONNECT" }
  | { type: "DISCONNECT" }
  | { type: "START_SESSION" }
  | { type: "FINISH_SESSION" }
  | { type: "START_RECORDING" }
  | { type: "STOP_RECORDING" }
  | { type: "SEND_AUDIO"; audioData: ArrayBuffer }
  | { type: "SEND_TEXT"; text: string }
  | { type: "PLAY_AUDIO"; audioUrl: string }
  | { type: "STOP_AUDIO" }
  | { type: "SET_ERROR"; error: string }
  | { type: "CLEAR_ERROR" }
  | { type: "CLEAR_MESSAGES" }

// 操作处理原子
export const realtimeVoiceActionsAtom = atom(
  null,
  async (get, set, action: RealtimeVoiceAction) => {
    const state = get(realtimeVoiceStateAtom)
    const config = get(appConfigAtom)

    switch (action.type) {
      case "CONNECT":
        if (state.isConnected || state.isConnecting) return
        
        try {
          set(realtimeVoiceStateAtom, {
            ...state,
            isConnecting: true,
            error: null
          })

          // 动态导入客户端
          const { createRealtimeVoiceClient } = await import("@/lib/realtime-voice-service")
          
          const client = createRealtimeVoiceClient({
            appId: config.realtimeVoice.appId,
            accessKey: config.realtimeVoice.accessKey,
            resourceId: config.realtimeVoice.resourceId,
            appKey: config.realtimeVoice.appKey,
            connectId: config.realtimeVoice.connectId
          })

          // 注册事件处理器
          setupEventHandlers(client, get, set)

          // 连接
          await client.connect()

          set(realtimeVoiceStateAtom, {
            ...get(realtimeVoiceStateAtom),
            client,
            isConnected: true,
            isConnecting: false,
            error: null
          })

        } catch (error) {
          set(realtimeVoiceStateAtom, {
            ...state,
            isConnecting: false,
            error: error instanceof Error ? error.message : "连接失败"
          })
        }
        break

      case "DISCONNECT":
        if (state.client) {
          try {
            await state.client.disconnect()
          } catch (error) {
            console.error("Disconnect error:", error)
          }
        }

        set(realtimeVoiceStateAtom, {
          ...state,
          client: null,
          isConnected: false,
          isConnecting: false,
          isSessionActive: false,
          sessionId: null,
          isRecording: false,
          isSpeaking: false,
          isThinking: false,
          currentAudioUrl: null,
          userTranscript: "",
          assistantText: "",
          error: null
        })
        break

      case "START_SESSION":
        if (!state.client || !state.isConnected || state.isSessionActive) return

        try {
          set(realtimeVoiceStateAtom, {
            ...state,
            isStartingSession: true,
            error: null
          })

          const sessionConfig = {
            botName: config.realtimeVoice.session.botName,
            strictAudit: config.realtimeVoice.session.strictAudit,
            ttsConfig: config.realtimeVoice.session.ttsFormat === "pcm" ? {
              audioConfig: {
                channel: config.realtimeVoice.session.pcmConfig.channel,
                format: "pcm",
                sampleRate: config.realtimeVoice.session.pcmConfig.sampleRate
              }
            } : undefined
          }

          await state.client.startSession(sessionConfig)

          set(realtimeVoiceStateAtom, {
            ...get(realtimeVoiceStateAtom),
            isSessionActive: true,
            isStartingSession: false,
            sessionId: state.client.currentSessionId,
            error: null
          })

        } catch (error) {
          set(realtimeVoiceStateAtom, {
            ...state,
            isStartingSession: false,
            error: error instanceof Error ? error.message : "启动会话失败"
          })
        }
        break

      case "FINISH_SESSION":
        if (!state.client || !state.isSessionActive) return

        try {
          await state.client.finishSession()
          
          set(realtimeVoiceStateAtom, {
            ...state,
            isSessionActive: false,
            sessionId: null,
            isRecording: false,
            isSpeaking: false,
            isThinking: false,
            currentAudioUrl: null,
            userTranscript: "",
            assistantText: ""
          })

        } catch (error) {
          set(realtimeVoiceStateAtom, {
            ...state,
            error: error instanceof Error ? error.message : "结束会话失败"
          })
        }
        break

      case "START_RECORDING":
        if (!state.client || !state.isSessionActive) return

        set(realtimeVoiceStateAtom, {
          ...state,
          isRecording: true,
          userTranscript: ""
        })
        break

      case "STOP_RECORDING":
        set(realtimeVoiceStateAtom, {
          ...state,
          isRecording: false
        })
        break

      case "SEND_AUDIO":
        if (!state.client || !state.isSessionActive) return

        try {
          state.client.sendAudio(action.audioData)
        } catch (error) {
          set(realtimeVoiceStateAtom, {
            ...state,
            error: error instanceof Error ? error.message : "发送音频失败"
          })
        }
        break

      case "SEND_TEXT":
        if (!state.client || !state.isSessionActive) return

        try {
          // 使用 ChatTTSText 发送文本
          state.client.sendChatTTSText(action.text, true, true)
          
          // 添加到消息列表
          const messageId = `${state.sessionId}-user-${Date.now()}`
          const userMessage: RealtimeVoiceMessage = {
            id: messageId,
            role: "user",
            content: action.text,
            timestamp: Date.now(),
            isInterim: false
          }

          set(realtimeVoiceStateAtom, {
            ...state,
            messages: [...state.messages, userMessage]
          })

        } catch (error) {
          set(realtimeVoiceStateAtom, {
            ...state,
            error: error instanceof Error ? error.message : "发送文本失败"
          })
        }
        break

      case "PLAY_AUDIO":
        set(realtimeVoiceStateAtom, {
          ...state,
          currentAudioUrl: action.audioUrl,
          isSpeaking: true
        })
        break

      case "STOP_AUDIO":
        set(realtimeVoiceStateAtom, {
          ...state,
          currentAudioUrl: null,
          isSpeaking: false
        })
        break

      case "SET_ERROR":
        set(realtimeVoiceStateAtom, {
          ...state,
          error: action.error
        })
        break

      case "CLEAR_ERROR":
        set(realtimeVoiceStateAtom, {
          ...state,
          error: null
        })
        break

      case "CLEAR_MESSAGES":
        set(realtimeVoiceStateAtom, {
          ...state,
          messages: [],
          userTranscript: "",
          assistantText: ""
        })
        break
    }
  }
)

// 设置事件处理器
function setupEventHandlers(
  client: RealtimeVoiceClient,
  get: any,
  set: any
) {
  // 连接事件
  client.on(ServerEventType.CONNECTION_STARTED, () => {
    console.log("端到端语音服务连接成功")
  })

  client.on(ServerEventType.CONNECTION_FAILED, (data) => {
    console.error("端到端语音服务连接失败:", data)
    const state = get()
    set({
      ...state,
      isConnected: false,
      isConnecting: false,
      error: data.error || "连接失败"
    })
  })

  // 会话事件
  client.on(ServerEventType.SESSION_STARTED, (data) => {
    console.log("会话启动成功:", data)
  })

  client.on(ServerEventType.SESSION_FAILED, (data) => {
    console.error("会话启动失败:", data)
    const state = get()
    set({
      ...state,
      isSessionActive: false,
      isStartingSession: false,
      error: data.error || "会话启动失败"
    })
  })

  // ASR 事件
  client.on(ServerEventType.ASR_INFO, () => {
    console.log("检测到用户开始说话")
  })

  client.on(ServerEventType.ASR_RESPONSE, (data) => {
    if (data.results && data.results.length > 0) {
      const result = data.results[0]
      const state = get()
      
      set({
        ...state,
        userTranscript: result.text
      })

      // 如果是最终结果，添加到消息列表
      if (!result.is_interim) {
        const messageId = `${state.sessionId}-user-${Date.now()}`
        const userMessage: RealtimeVoiceMessage = {
          id: messageId,
          role: "user",
          content: result.text,
          timestamp: Date.now(),
          isInterim: false
        }

        set({
          ...state,
          messages: [...state.messages, userMessage],
          userTranscript: ""
        })
      }
    }
  })

  client.on(ServerEventType.ASR_ENDED, () => {
    console.log("用户说话结束")
  })

  // TTS 事件
  client.on(ServerEventType.TTS_SENTENCE_START, (data) => {
    console.log("TTS开始:", data)
    const state = get()
    set({
      ...state,
      isThinking: false,
      isSpeaking: true,
      assistantText: data.text || ""
    })
  })

  client.on(ServerEventType.TTS_RESPONSE, (audioData) => {
    // 处理音频数据 - 创建音频URL
    const blob = new Blob([audioData], { type: 'audio/ogg' })
    const audioUrl = URL.createObjectURL(blob)
    
    const state = get()
    set({
      ...state,
      currentAudioUrl: audioUrl
    })
  })

  client.on(ServerEventType.TTS_SENTENCE_END, () => {
    console.log("TTS句子结束")
  })

  client.on(ServerEventType.TTS_ENDED, () => {
    console.log("TTS结束")
    const state = get()
    
    // 如果有文本内容，添加到消息列表
    if (state.assistantText) {
      const messageId = `${state.sessionId}-assistant-${Date.now()}`
      const assistantMessage: RealtimeVoiceMessage = {
        id: messageId,
        role: "assistant",
        content: state.assistantText,
        timestamp: Date.now(),
        isInterim: false,
        audioUrl: state.currentAudioUrl || undefined
      }

      set({
        ...state,
        messages: [...state.messages, assistantMessage],
        isSpeaking: false,
        assistantText: ""
      })
    } else {
      set({
        ...state,
        isSpeaking: false
      })
    }
  })

  // Chat 事件
  client.on(ServerEventType.CHAT_RESPONSE, (data) => {
    console.log("收到AI回复:", data)
    const state = get()
    set({
      ...state,
      isThinking: true,
      assistantText: data.content || ""
    })
  })

  client.on(ServerEventType.CHAT_ENDED, () => {
    console.log("AI回复结束")
    const state = get()
    set({
      ...state,
      isThinking: false
    })
  })

  // 错误处理
  client.onError((error) => {
    console.error("端到端语音服务错误:", error)
    const state = get()
    set({
      ...state,
      error: error.message
    })
  })
}