// AI 语音聊天状态类型
import { atomWithStorage } from "jotai/utils"

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: number
  userId: string
  isComplete: boolean // 消息是否完整
  isDefinite: boolean // 消息是否基于确定的语音识别结果
}

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
  chatHistory: ChatMessage[]
}

export const voiceChatStateAtom = atomWithStorage<VoiceChatState>("voiceChatState", {
  isAgentActive: false,
  taskId: null,
  agentUserId: null,
  error: null,
  isStarting: false,
  isStopping: false,
  chatHistory: [],
}, undefined, {
  // avoid hydration error
  getOnInit: false,
})