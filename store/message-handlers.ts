// 处理房间二进制消息
import { AGENT_PREFIX } from "@/constants"
import { appConfigAtom } from "@/store/app-config"
import { AGENT_BRIEF, AgentBriefMessage, MESSAGE_TYPE, MessageParser, SubtitleMessage } from "@/store/message-parser"

import { ChatMessage, voiceChatStateAtom } from "@/store/voice-chat-state"
import type { Getter, Setter } from "jotai"

export function handleRoomBinaryMessageReceived(e: { userId: string; message: ArrayBuffer }, set: Setter, get: Getter) {
  // return

  try {
    // 首先尝试使用新的字幕解析方法
    const subtitleMessage = MessageParser.parseSubtitleMessage(e.message)
    if (subtitleMessage) {
      // console.log('收到字幕消息:', { userId: e.userId, subtitleMessage })
      handleSubtitleMessage(subtitleMessage!, set, get)
      return
    }

    // 如果不是字幕消息，使用向后兼容的 TLV 解析
    const { type, value } = MessageParser.tlv2String(e.message)
    const parsed = JSON.parse(value) as { type: string; data: unknown }

    // console.log('收到房间消息:', { userId: e.userId, type, parsed })

    switch (parsed.type as MESSAGE_TYPE) {
      case MESSAGE_TYPE.BRIEF:
        // 处理智能体状态变化
        handleAgentBrief(parsed as AgentBriefMessage, set, get)
        break

      case MESSAGE_TYPE.FUNCTION_CALL:
        // 处理函数调用（暂时记录）
        console.log("收到函数调用消息:", parsed)
        break

      default:
        console.log("未知消息类型:", type, parsed)
    }
  } catch (error) {
    console.error("解析房间二进制消息失败:", error)
  }
}

// 处理智能体状态变化
function handleAgentBrief(
  parsed: AgentBriefMessage,
  set: Setter,
  get: Getter,
) {
  const { Stage } = parsed || {}
  const { Code, Description } = Stage || {}

  if (!Code) return

  const currentState = get(voiceChatStateAtom)
  const now = Date.now()

  const newAgentStatus = {
    isThinking: false,
    isTalking: false,
    lastUpdate: now,
  }

  switch (Code) {
    case AGENT_BRIEF.THINKING:
      newAgentStatus.isThinking = true
      console.log("AI智能体思考中...", Description)
      break

    case AGENT_BRIEF.SPEAKING:
      newAgentStatus.isTalking = true
      console.log("AI智能体开始说话...", Description)
      break

    case AGENT_BRIEF.FINISHED:
      console.log("AI智能体结束说话", Description)
      break

    case AGENT_BRIEF.INTERRUPTED:
      console.log("AI智能体被打断", Description)
      break

    default:
      console.log("未知智能体状态:", Code, Description)
      return
  }

  set(voiceChatStateAtom, {
    ...currentState,
    agentStatus: newAgentStatus,
  })
}

// 处理字幕消息
/**
 * @description
 * 1. 不同用户的消息 → 新增
 * 2. 同一用户，但上一条消息是definite → 新增
 * 3. 其他情况 → 更新最后一条消息
 *
 * @param parsed
 * @param set
 * @param get
 * @returns
 */
function handleSubtitleMessage(
  parsed: SubtitleMessage,
  set: Setter,
  get: Getter,
) {
  const data = parsed.data?.[0]
  if (!data) return

  const { text, definite, userId, paragraph } = data

  if (text) {
    const currentState = get(voiceChatStateAtom)
    const config = get(appConfigAtom)

    // 处理聊天记录 - 支持实时更新
    const isUser = userId === config.rtc.uid
    const isAgent = userId?.startsWith(AGENT_PREFIX)

    if (isUser || isAgent) {
      const role = isUser ? "user" : "assistant"
      const allChatHistory = [...currentState.allChatHistory]

      // 查找最后一条消息
      const lastMessage = allChatHistory[allChatHistory.length - 1]
      const isSameUser = lastMessage && lastMessage.userId === userId

      // 判断是否需要新增聊天记录
      const shouldCreateNew = !isSameUser || (isSameUser && lastMessage.isDefinite)
      console.log("shouldCreateNew", {isSameUser, userId, isDefinite: lastMessage?.isDefinite, shouldCreateNew})

      if (shouldCreateNew) {
        // 新增聊天记录
        const messageId = `${userId}-${Date.now()}`
        const newMessage: ChatMessage = {
          id: messageId,
          role,
          content: text,
          timestamp: Date.now(),
          userId,
          roomId: config.rtc.roomId,
          isComplete: !!paragraph,
          isDefinite: !!definite,
        }

        // 检查是否已存在相似消息（避免重复）
        const isDuplicate = lastMessage &&
          lastMessage.userId === userId &&
          lastMessage.content === text &&
          (Date.now() - lastMessage.timestamp) < 2000

        if (!isDuplicate) {
          allChatHistory.push(newMessage)
          console.log("新增聊天记录:", { text, userId, reason: !isSameUser ? "不同用户" : "上条消息已确定" })
        }
      } else {
        // 更新最后一条消息
        const lastMessageIndex = allChatHistory.length - 1
        allChatHistory[lastMessageIndex] = {
          ...lastMessage,
          content: text,
          timestamp: Date.now(),
          isComplete: !!paragraph,
          isDefinite: !!definite,
        }
        console.log("更新聊天记录:", { text, userId, definite, paragraph })
      }

      // 更新状态
      set(voiceChatStateAtom, {
        ...currentState,
        subtitle: {
          text,
          userId: config.rtc.uid,
          roomId: config.rtc.roomId,
          isDefinite: !!definite,
          timestamp: Date.now(),
        },
        allChatHistory,
      })
    }
  }
}
