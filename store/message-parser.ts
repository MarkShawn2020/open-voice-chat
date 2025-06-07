// TLV 解析工具

export class MessageParser {
  /**
   * 解析火山引擎字幕二进制消息
   * 消息格式：magic number (4 bytes "subv") + length (4 bytes) + subtitle_message
   */
  static parseSubtitleMessage(messageBuffer: ArrayBuffer): SubtitleMessage | null {
    try {
      if (!messageBuffer || messageBuffer.byteLength < 8) {
        console.warn("字幕消息缓冲区太小")
        return null
      }

      const dataView = new DataView(messageBuffer)

      // 检查 magic number "subv" (0x73756276)
      const magicNumber = dataView.getUint32(0, false) // big-endian
      if (magicNumber !== 0x73756276) {
        console.warn("字幕消息 magic number 不匹配", { magicNumber })
        return null // todo: 兼容处理
      }

      // 读取消息长度
      const length = dataView.getUint32(4, false) // big-endian

      if (messageBuffer.byteLength < 8 + length) {
        console.warn("字幕消息长度不匹配", { length })
        return null // todo: 兼容处理
      }

      // 提取字幕消息内容
      const subtitleBuffer = messageBuffer.slice(8, 8 + length)
      const decoder = new TextDecoder("utf-8")
      const subtitleJson = decoder.decode(subtitleBuffer)

      // 解析 JSON
      const parsedData = JSON.parse(subtitleJson) as SubtitleMessage

      // 验证消息类型
      if (parsedData.type !== "subtitle") {
        console.warn("字幕消息类型不正确:", parsedData.type)
        return null
      }

      return parsedData
    } catch (error) {
      console.error("字幕消息解析失败:", error)
      return null
    }
  }

  /**
   * 向后兼容的 TLV 解析方法
   * @deprecated 建议使用 parseSubtitleMessage 方法
   */
  static tlv2String(tlvBuffer: ArrayBuffer) {
    try {
      if (!tlvBuffer || tlvBuffer.byteLength < 8) {
        throw new Error("Invalid TLV buffer")
      }

      const dataView = new DataView(tlvBuffer)
      const type = dataView.getUint32(0, false) // big-endian
      const length = dataView.getUint32(4, false) // big-endian

      if (length === undefined || length < 0) {
        throw new Error("Invalid TLV length")
      }

      if (tlvBuffer.byteLength < 8 + length) {
        throw new Error("Buffer too small for declared length")
      }

      const valueBuffer = tlvBuffer.slice(8, 8 + length)
      const decoder = new TextDecoder("utf-8")
      const value = decoder.decode(valueBuffer)

      return {
        type: type.toString(),
        value: value,
      }
    } catch (error) {
      console.error("TLV 解析失败:", error)
      throw error
    }
  }
}

/**
 * 字幕数据结构定义
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
 "userId": "agent_a8d496ec-139f-4ade-b868-90f293adca56"
 }
 * ```
 */
export interface SubtitleData {
  text: string
  definite: boolean
  userId: string
  paragraph: boolean
  language: string
  mode?: number
  sequence: number
  timestamp?: number
}

export interface SubtitleMessage {
  type: string // 固定为 "subtitle"
  data?: SubtitleData[]
} // 消息类型定义
// 消息类型枚举
export enum MESSAGE_TYPE {
  BRIEF = "conv",
  SUBTITLE = "subtitle",
  FUNCTION_CALL = "tool",
}

// 智能体状态码
export enum AGENT_BRIEF {
  THINKING = "thinking",
  SPEAKING = "speaking",
  FINISHED = "finished",
  INTERRUPTED = "interrupted",
}

export interface AgentBriefMessage {
  type: string
  Stage?: {
    Code: string
    Description?: string
  }
} // 聊天消息类型
