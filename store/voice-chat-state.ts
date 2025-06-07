// AI 语音聊天状态类型
import { appConfigAtom } from "@/store/app-config"
import { atom } from "jotai"
import { atomWithStorage } from "jotai/utils"

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: number
  userId: string
  roomId: string // 新增：房间ID
  isComplete: boolean // 消息是否完整
  isDefinite: boolean // 消息是否基于确定的语音识别结果
}

export interface VoiceChatState {
  isAgentActive: boolean
  taskId: string | null
  error: string | null
  isStarting: boolean
  isStopping: boolean
  subtitle?: {
    text: string
    userId: string
    roomId: string // 新增：房间ID
    isDefinite: boolean
    timestamp: number
  }
  agentStatus?: {
    isThinking: boolean
    isTalking: boolean
    lastUpdate: number
  }
  // 全局聊天记录，通过roomId、userId、taskId进行筛选
  allChatHistory: ChatMessage[]
}

// 工具函数：生成房间键
export const createRoomKey = (roomId: string, userId: string, taskId: string): string => {
  return `${roomId}.${userId}.${taskId}`
}

export const currentMessagesAtom = atom((get) => {
  const roomId = get(appConfigAtom).rtc.roomId
  const state = get(voiceChatStateAtom)

  const allMessages = state.allChatHistory

  let curMessages: ChatMessage[] = []

  if (roomId ) {
      curMessages =  allMessages.filter(message =>
        message.roomId === roomId 
      )
  }

  console.log("当前房间聊天记录:", {
    state,
    allMessages,
    curMessages
  })

  return curMessages
})


export const voiceChatStateAtom = atomWithStorage<VoiceChatState>("voiceChatState", {
  isAgentActive: false,
  taskId: null,
  error: null,
  isStarting: false,
  isStopping: false,
  allChatHistory: [],
}, undefined, {
  // avoid hydration error
  getOnInit: false,
})