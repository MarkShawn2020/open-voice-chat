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

// 聊天房间唯一标识
export interface ChatRoomKey {
  roomId: string
  userId: string
  taskId: string
}

// 单个聊天房间的状态
export interface ChatRoomState {
  roomKey: ChatRoomKey
  isAgentActive: boolean
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
  createdAt: number
  lastActivity: number
}

// 全局语音聊天状态
export interface VoiceChatState {
  // 当前活跃的房间
  currentRoomKey: ChatRoomKey | null
  // 所有聊天房间的状态，key 为 "${roomId}:${userId}:${taskId}"
  rooms: Record<string, ChatRoomState>
}

// 生成房间标识符
export function getRoomIdentifier(roomKey: ChatRoomKey): string {
  return `${roomKey.roomId}:${roomKey.userId}:${roomKey.taskId}`
}

// 解析房间标识符
export function parseRoomIdentifier(identifier: string): ChatRoomKey | null {
  const parts = identifier.split(':')
  if (parts.length !== 3) return null
  
  const [roomId, userId, taskId] = parts
  if (!roomId || !userId || !taskId) return null
  
  return {
    roomId,
    userId,
    taskId
  }
}

// 创建新的聊天房间状态
export function createChatRoomState(roomKey: ChatRoomKey): ChatRoomState {
  const now = Date.now()
  return {
    roomKey,
    isAgentActive: false,
    agentUserId: null,
    error: null,
    isStarting: false,
    isStopping: false,
    chatHistory: [],
    createdAt: now,
    lastActivity: now,
  }
}

export const voiceChatStateAtom = atomWithStorage<VoiceChatState>("voiceChatState", {
  currentRoomKey: null,
  rooms: {},
}, undefined, {
  // avoid hydration error
  getOnInit: false,
})

// 获取当前房间状态的辅助函数
export function getCurrentRoomState(state: VoiceChatState): ChatRoomState | null {
  if (!state.currentRoomKey) return null
  
  const identifier = getRoomIdentifier(state.currentRoomKey)
  return state.rooms[identifier] || null
}

// 获取或创建房间状态
export function getOrCreateRoomState(
  state: VoiceChatState,
  roomKey: ChatRoomKey
): { state: VoiceChatState; roomState: ChatRoomState } {
  const identifier = getRoomIdentifier(roomKey)
  
  if (!state.rooms[identifier]) {
    state.rooms[identifier] = createChatRoomState(roomKey)
  }
  
  return {
    state,
    roomState: state.rooms[identifier]
  }
}

// 更新房间的最后活动时间
export function updateRoomActivity(state: VoiceChatState, roomKey: ChatRoomKey): void {
  const identifier = getRoomIdentifier(roomKey)
  if (state.rooms[identifier]) {
    state.rooms[identifier].lastActivity = Date.now()
  }
}