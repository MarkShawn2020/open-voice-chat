// RTC 操作原子
import { startVoiceChat, stopVoiceChat } from "@/lib/voice-chat-actions"
import { appConfigAtom } from "@/store/app-config"
import { handleRoomBinaryMessageReceived } from "@/store/message-handlers"

import { rtcStateAtom } from "@/store/rtc-state"
import { voiceChatStateAtom } from "@/store/voice-chat-state"
import VERTC, { MediaType, RoomProfileType } from "@volcengine/rtc"
import { atom, type Getter, type Setter } from "jotai/index"
import { set as lodashSet } from "lodash"

// 操作类型定义
export type RTCAction =
  | { type: "INITIALIZE_ENGINE" }
  | { type: "JOIN_ROOM" }
  | { type: "LEAVE_ROOM" }
  | { type: "START_LOCAL_AUDIO" }
  | { type: "STOP_LOCAL_AUDIO" }
  | { type: "START_VOICE_CHAT"; systemMessage?: string; welcomeMessage?: string }
  | { type: "STOP_VOICE_CHAT" }
  | { type: "DELETE_CHAT_MESSAGE"; messageId: string }
  | { type: "CLEAR_CHAT_HISTORY" }
  | { type: "SET_ERROR"; payload: string }
  | { type: "CLEAR_ERROR" }
  | { type: "BIND_KEY", payload: { key: string, value: string } }
export const rtcActionsAtom = atom(null, (get: Getter, set: Setter, action: RTCAction) => {
  const state = get(rtcStateAtom)
  const config = get(appConfigAtom)
  const voiceChatState = get(voiceChatStateAtom)

  switch (action.type) {
    case "INITIALIZE_ENGINE":
      if (!config?.rtc?.appId) {
        set(rtcStateAtom, { ...state, error: "AppID is required" })
        return
      }

      try {
        const engine = VERTC.createEngine(config.rtc.appId)

        // 监听事件
        engine.on(VERTC.events.onUserPublishStream, (e: { userId: string; mediaType: MediaType }) => {
          console.log("用户发布流:", e.userId)
          const currentState = get(rtcStateAtom)
          if (!currentState.remoteUsers.includes(e.userId)) {
            set(rtcStateAtom, {
              ...currentState,
              remoteUsers: [...currentState.remoteUsers, e.userId],
            })
          }
        })

        engine.on(VERTC.events.onUserUnpublishStream, (e: { userId: string; mediaType: MediaType }) => {
          console.log("用户取消发布流:", e.userId)
          const currentState = get(rtcStateAtom)
          set(rtcStateAtom, {
            ...currentState,
            remoteUsers: currentState.remoteUsers.filter((id) => id !== e.userId),
          })
        })

        engine.on(VERTC.events.onUserJoined, (e: { userInfo: { userId: string } }) => {
          console.log("用户加入房间:", e.userInfo.userId)
        })

        engine.on(VERTC.events.onUserLeave, (e: { userInfo: { userId: string } }) => {
          console.log("用户离开房间:", e.userInfo.userId)
        })

        // 处理房间二进制消息 - AI智能体实时数据
        engine.on(VERTC.events.onRoomBinaryMessageReceived, (e: { userId: string; message: ArrayBuffer }) => {
          handleRoomBinaryMessageReceived(e, set, get)
        })

        set(rtcStateAtom, { ...state, engine, error: null })
      } catch (error) {
        console.error("初始化引擎失败:", error)
        set(rtcStateAtom, { ...state, error: `初始化引擎失败: ${error}` })
      }
      break

    case "JOIN_ROOM":
      console.log("加入房间:", config)
      if (!state.engine || !config) {
        set(rtcStateAtom, { ...state, error: "引擎未初始化或配置缺失" })
        return
      }

      state.engine
        .joinRoom(
          config.rtc.token,
          config.rtc.roomId,
          { userId: config.rtc.uid },
          {
            isAutoPublish: true,
            isAutoSubscribeAudio: true,
            isAutoSubscribeVideo: false,
            roomProfileType: RoomProfileType.communication,
          },
        )
        .then(() => {
          set(rtcStateAtom, { ...state, isConnected: true, error: null })
        })
        .catch((error) => {
          set(rtcStateAtom, { ...state, error: `加入房间失败: ${error.message}` })
        })
      break

    case "LEAVE_ROOM":
      console.log("离开房间")
      if (state.engine && state.isConnected) {
        try {
          // 如果 AI 智能体正在运行，先停止它
          if (voiceChatState.isAgentActive && voiceChatState.taskId) {
            console.log("停止 AI 智能体")
            set(rtcActionsAtom, { type: "STOP_VOICE_CHAT" })
          }

          state.engine
            .leaveRoom()
            .then(() => {
              set(rtcStateAtom, {
                ...state,
                isConnected: false,
                isLocalAudioEnabled: false,
                isRemoteAudioEnabled: false,
                remoteUsers: [],
                error: null,
              })
            })
            .catch((error) => {
              set(rtcStateAtom, { ...state, error: `离开房间失败: ${error.message}` })
            })
        } catch (error) {
          console.error("离开房间失败:", error)
          set(rtcStateAtom, { ...state, error: `离开房间失败: ${error}` })
        }
      }
      break

    case "START_LOCAL_AUDIO":
      if (!state.engine) {
        set(rtcStateAtom, { ...state, error: "引擎未初始化" })
        return
      }

      const audioEngine = state.engine
      audioEngine
        .publishStream(MediaType.AUDIO)
        .then(() => {
          console.log("发布音频流成功")
          return audioEngine.startAudioCapture()
        })
        .then(() => {
          console.log("启动音频采集成功")
          set(rtcStateAtom, { ...state, isLocalAudioEnabled: true, error: null })
        })
        .catch((error) => {
          console.error("启动音频采集失败:", error)
          set(rtcStateAtom, { ...state, error: `启动音频采集失败: ${error.message}` })
        })
      break

    case "STOP_LOCAL_AUDIO":
      console.log("停止音频采集")
      if (!state.engine) return

      state.engine.stopAudioCapture()
      set(rtcStateAtom, { ...state, isLocalAudioEnabled: false })
      break

    case "START_VOICE_CHAT":
      console.log("启动 AI 语音聊天")
      if (state.isConnected && !voiceChatState.isAgentActive && !voiceChatState.isStarting) {
        set(voiceChatStateAtom, (prev) => ({
          ...prev,
          isStarting: true,
          error: null,
        }))

        startVoiceChat({
          appId: config.rtc.appId,
          roomId: config.rtc.roomId,
          targetUserId: config.rtc.uid,
          systemMessage: action.systemMessage || config.llm.systemMessage,
          welcomeMessage: action.welcomeMessage || config.llm.welcomeMessage,
          asr: {
            appId: config.asr.appId,
            accessToken: config.asr.accessToken,
            cluster: config.asr.cluster,
            mode: config.asr.mode,
          },
          tts: {
            appId: config.tts.appId,
            accessToken: config.tts.accessToken,
            voiceType: config.tts.voiceType,
            speechRate: config.tts.speechRate,
            pitchRate: config.tts.pitchRate,
          },
          llm: {
            endpointId: config.llm.endpointId,
            temperature: config.llm.temperature,
            maxTokens: config.llm.maxTokens,
            topP: config.llm.topP,
          },
        })
          .then((result) => {
            if (result.success && result.taskId) {
              console.log("启动 AI 语音聊天成功")
              set(voiceChatStateAtom, (prev) => ({
                ...prev,
                isAgentActive: true,
                taskId: result.taskId || null,
                agentUserId: `voice_agent_${result.taskId}`,
                isStarting: false,
                error: null,
              }))
            } else {
              console.error("启动 AI 语音聊天失败:", result.error)
              set(voiceChatStateAtom, (prev) => ({
                ...prev,
                isStarting: false,
                error: result.error || "启动智能体失败",
              }))
            }
          })
          .catch((error) => {
            console.error("启动 AI 语音聊天失败:", error)
            set(voiceChatStateAtom, (prev) => ({
              ...prev,
              isStarting: false,
              error: error instanceof Error ? error.message : "启动智能体失败",
            }))
          })
      }
      break

    case "STOP_VOICE_CHAT":
      console.log("停止 AI 语音聊天")
      if (voiceChatState.isAgentActive && voiceChatState.taskId && !voiceChatState.isStopping) {
        set(voiceChatStateAtom, (prev) => ({
          ...prev,
          isStopping: true,
          error: null,
        }))

        stopVoiceChat(config.rtc.appId, config.rtc.roomId, voiceChatState.taskId)
          .then((result) => {
            if (result.success) {
              console.log("停止 AI 语音聊天成功")
              set(voiceChatStateAtom, (prev) => ({
                ...prev,
                isAgentActive: false,
                taskId: null,
                agentUserId: null,
                isStopping: false,
                error: null,
              }))
            } else {
              console.error("停止 AI 语音聊天失败:", result.error)
              set(voiceChatStateAtom, (prev) => ({
                ...prev,
                isStopping: false,
                error: result.error || "停止智能体失败",
              }))
            }
          })
          .catch((error) => {
            console.error("停止 AI 语音聊天失败:", error)
            set(voiceChatStateAtom, (prev) => ({
              ...prev,
              isStopping: false,
              error: error instanceof Error ? error.message : "停止智能体失败",
            }))
          })
      }
      break

    case "DELETE_CHAT_MESSAGE":
      const allChatHistory = [...voiceChatState.allChatHistory]
      const index = allChatHistory.findIndex((message) => message.id === action.messageId)
      if (index !== -1) {
        allChatHistory.splice(index, 1)
        set(voiceChatStateAtom, (prev) => ({ ...prev, allChatHistory }))
      }
      break

    case "CLEAR_CHAT_HISTORY":
      set(voiceChatStateAtom, (prev) => ({ ...prev, allChatHistory: [] }))
      break

    case "SET_ERROR":
      console.log("设置错误:", action.payload)
      set(rtcStateAtom, { ...state, error: action.payload })
      break

    case "CLEAR_ERROR":
      console.log("清除错误")
      set(rtcStateAtom, { ...state, error: null })
      break

    case "BIND_KEY":
      const { key, value } = action.payload
      set(appConfigAtom, (prev) => {
        const newConfig = { ...prev }
        lodashSet(newConfig, key, value)
        return newConfig
      })
      break
  }
})