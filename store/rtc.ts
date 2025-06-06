"use client"

import VERTC, { IRTCEngine, MediaType, RoomProfileType } from '@volcengine/rtc'
import { atom } from "jotai"
import { atomWithStorage } from "jotai/utils"
import { startVoiceChat, stopVoiceChat } from '@/lib/voice-chat-actions'

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

// AI 语音聊天状态
export interface VoiceChatState {
  isAgentActive: boolean
  taskId: string | null
  agentUserId: string | null
  error: string | null
  isStarting: boolean
  isStopping: boolean
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
export const rtcActionsAtom = atom(null, (get, set, action: RTCAction) => {
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
      console.log('启动音频采集')
      if (!state.engine) {
        set(rtcStateAtom, { ...state, error: '引擎未初始化' })
        return
      }
      
      state.engine.startAudioCapture().then(() => {
        set(rtcStateAtom, { ...state, isLocalAudioEnabled: true, error: null })
      }).catch((error) => {
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
        
        stopVoiceChat(config.appId, voiceChatState.taskId).then((result) => {
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
