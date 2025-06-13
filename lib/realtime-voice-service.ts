/**
 * 火山引擎端到端实时语音大模型服务
 * 基于 WebSocket 协议，支持语音到语音的实时对话
 */

// WebSocket 连接配置
interface RealtimeVoiceConfig {
  appId: string
  accessKey: string
  resourceId: string // 固定值: volc.speech.dialog
  appKey: string // 固定值: PlgvMymc7f3tQnJ6
  connectId?: string // 可选的连接追踪ID
}

// 事件类型定义
export enum ClientEventType {
  START_CONNECTION = 1,
  FINISH_CONNECTION = 2,
  START_SESSION = 100,
  FINISH_SESSION = 102,
  TASK_REQUEST = 200, // 上传音频
  SAY_HELLO = 300,    // 打招呼文本
  CHAT_TTS_TEXT = 500 // 指定文本合成音频
}

export enum ServerEventType {
  CONNECTION_STARTED = 50,
  CONNECTION_FAILED = 51,
  CONNECTION_FINISHED = 52,
  SESSION_STARTED = 150,
  SESSION_FINISHED = 152,
  SESSION_FAILED = 153,
  TTS_SENTENCE_START = 350,
  TTS_SENTENCE_END = 351,
  TTS_RESPONSE = 352,
  TTS_ENDED = 359,
  ASR_INFO = 450,
  ASR_RESPONSE = 451,
  ASR_ENDED = 459,
  CHAT_RESPONSE = 550,
  CHAT_ENDED = 559
}

// 消息类型
export enum MessageType {
  FULL_CLIENT_REQUEST = 0b0001,
  FULL_SERVER_RESPONSE = 0b1001,
  AUDIO_ONLY_REQUEST = 0b0010,
  AUDIO_ONLY_RESPONSE = 0b1011,
  ERROR_INFORMATION = 0b1111
}

// 序列化方法
export enum SerializationMethod {
  RAW = 0b0000,  // 无特殊序列化，主要针对二进制音频数据
  JSON = 0b0001  // 主要针对文本类型消息
}

// 压缩方法
export enum CompressionMethod {
  NONE = 0b0000, // 无压缩（推荐）
  GZIP = 0b0001  // gzip压缩
}

// Message type specific flags
export enum MessageFlags {
  NO_SEQUENCE = 0b0000,
  SEQUENCE_NON_TERMINAL = 0b0001,
  SEQUENCE_LAST_NO_NUMBER = 0b0010,
  SEQUENCE_LAST_NEGATIVE = 0b0011,
  EVENT_ID = 0b0100
}

// 会话配置
interface SessionConfig {
  botName?: string
  dialogId?: string
  strictAudit?: boolean
  ttsConfig?: {
    audioConfig?: {
      channel: number
      format: string
      sampleRate: number
    }
  }
}

// 事件处理器类型
type EventHandler = (data: any) => void

// 错误处理器类型
type ErrorHandler = (error: Error) => void

/**
 * 火山引擎端到端实时语音大模型客户端
 */
export class RealtimeVoiceClient {
  private ws: WebSocket | null = null
  private config: RealtimeVoiceConfig
  private eventHandlers: Map<ServerEventType, EventHandler[]> = new Map()
  private errorHandlers: ErrorHandler[] = []
  private sessionId: string | null = null
  private connectId: string
  private isConnected = false
  private isSessionActive = false

  constructor(config: RealtimeVoiceConfig) {
    this.config = config
    this.connectId = config.connectId || this.generateUUID()
  }

  /**
   * 连接到端到端语音服务
   */
  async connect(): Promise<void> {
    if (this.ws) {
      throw new Error('WebSocket connection already exists')
    }

    const url = 'wss://openspeech.bytedance.com/api/v3/realtime/dialogue'
    
    const headers = {
      'X-Api-App-ID': this.config.appId,
      'X-Api-Access-Key': this.config.accessKey,
      'X-Api-Resource-Id': this.config.resourceId,
      'X-Api-App-Key': this.config.appKey,
      'X-Api-Connect-Id': this.connectId
    }

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url)
        
        // 设置二进制数据类型
        this.ws.binaryType = 'arraybuffer'

        this.ws.onopen = () => {
          console.log('WebSocket connected to realtime voice service')
          this.isConnected = true
          
          // 发送连接开始事件
          this.sendStartConnection()
          resolve()
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data)
        }

        this.ws.onclose = (event) => {
          console.log('WebSocket connection closed:', event.code, event.reason)
          this.isConnected = false
          this.isSessionActive = false
          this.ws = null
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          this.notifyError(new Error('WebSocket connection error'))
          reject(error)
        }

      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    if (this.isSessionActive) {
      await this.finishSession()
    }

    if (this.ws) {
      this.sendFinishConnection()
      this.ws.close()
      this.ws = null
    }
    
    this.isConnected = false
  }

  /**
   * 开始会话
   */
  async startSession(config: SessionConfig = {}): Promise<void> {
    if (!this.isConnected) {
      throw new Error('WebSocket not connected')
    }

    if (this.isSessionActive) {
      throw new Error('Session already active')
    }

    this.sessionId = this.generateUUID()

    const sessionData = {
      dialog: {
        bot_name: config.botName || '豆包',
        dialog_id: config.dialogId || '',
        extra: {
          strict_audit: config.strictAudit !== false
        }
      },
      ...config.ttsConfig
    }

    this.sendEvent(ClientEventType.START_SESSION, sessionData, this.sessionId)
    this.isSessionActive = true
  }

  /**
   * 结束会话
   */
  async finishSession(): Promise<void> {
    if (!this.isSessionActive || !this.sessionId) {
      return
    }

    this.sendEvent(ClientEventType.FINISH_SESSION, {}, this.sessionId)
    this.isSessionActive = false
    this.sessionId = null
  }

  /**
   * 发送音频数据
   */
  sendAudio(audioData: ArrayBuffer): void {
    if (!this.isConnected || !this.isSessionActive || !this.sessionId) {
      throw new Error('Session not active')
    }

    this.sendBinaryEvent(ClientEventType.TASK_REQUEST, audioData, this.sessionId)
  }

  /**
   * 发送打招呼消息
   */
  sendHello(content: string): void {
    if (!this.isConnected || !this.isSessionActive || !this.sessionId) {
      throw new Error('Session not active')
    }

    this.sendEvent(ClientEventType.SAY_HELLO, { content }, this.sessionId)
  }

  /**
   * 发送文本合成音频请求
   */
  sendChatTTSText(content: string, start: boolean = true, end: boolean = false): void {
    if (!this.isConnected || !this.isSessionActive || !this.sessionId) {
      throw new Error('Session not active')
    }

    this.sendEvent(ClientEventType.CHAT_TTS_TEXT, { start, content, end }, this.sessionId)
  }

  /**
   * 注册事件处理器
   */
  on(eventType: ServerEventType, handler: EventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, [])
    }
    this.eventHandlers.get(eventType)!.push(handler)
  }

  /**
   * 注册错误处理器
   */
  onError(handler: ErrorHandler): void {
    this.errorHandlers.push(handler)
  }

  /**
   * 移除事件处理器
   */
  off(eventType: ServerEventType, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(eventType)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  // 私有方法

  private sendStartConnection(): void {
    this.sendEvent(ClientEventType.START_CONNECTION, {})
  }

  private sendFinishConnection(): void {
    this.sendEvent(ClientEventType.FINISH_CONNECTION, {})
  }

  private sendEvent(eventType: ClientEventType, data: any, sessionId?: string): void {
    const messageType = MessageType.FULL_CLIENT_REQUEST
    const serializationMethod = SerializationMethod.JSON
    const compressionMethod = CompressionMethod.NONE
    const flags = MessageFlags.EVENT_ID

    const payload = JSON.stringify(data)
    const payloadBuffer = new TextEncoder().encode(payload)

    const frame = this.buildBinaryFrame(
      messageType,
      flags,
      serializationMethod,
      compressionMethod,
      eventType,
      payloadBuffer,
      sessionId
    )

    this.ws?.send(frame)
  }

  private sendBinaryEvent(eventType: ClientEventType, audioData: ArrayBuffer, sessionId: string): void {
    const messageType = MessageType.AUDIO_ONLY_REQUEST
    const serializationMethod = SerializationMethod.RAW
    const compressionMethod = CompressionMethod.NONE
    const flags = MessageFlags.EVENT_ID

    const frame = this.buildBinaryFrame(
      messageType,
      flags,
      serializationMethod,
      compressionMethod,
      eventType,
      audioData,
      sessionId
    )

    this.ws?.send(frame)
  }

  private buildBinaryFrame(
    messageType: MessageType,
    flags: MessageFlags,
    serializationMethod: SerializationMethod,
    compressionMethod: CompressionMethod,
    eventType: ClientEventType,
    payload: ArrayBuffer | Uint8Array,
    sessionId?: string
  ): ArrayBuffer {
    // 计算所需的缓冲区大小
    let totalSize = 4 // header
    totalSize += 4 // event
    
    if (sessionId) {
      totalSize += 4 // session id size
      totalSize += new TextEncoder().encode(sessionId).length // session id
    }
    
    totalSize += 4 // payload size
    totalSize += payload.byteLength // payload

    const buffer = new ArrayBuffer(totalSize)
    const view = new DataView(buffer)
    let offset = 0

    // Header (4 bytes)
    const header = 
      (0b0001 << 4) | 0b0001 | // Protocol Version (4bit) | Header Size (4bit)
      (messageType << 8) | (flags << 12) | // Message Type (4bit) | Flags (4bit)
      (serializationMethod << 16) | (compressionMethod << 20) | // Serialization (4bit) | Compression (4bit)
      (0x00 << 24) // Reserved

    view.setUint32(offset, header, false) // big endian
    offset += 4

    // Event ID (4 bytes)
    view.setUint32(offset, eventType, false)
    offset += 4

    // Session ID
    if (sessionId) {
      const sessionIdBytes = new TextEncoder().encode(sessionId)
      view.setUint32(offset, sessionIdBytes.length, false)
      offset += 4
      
      const sessionIdArray = new Uint8Array(buffer, offset, sessionIdBytes.length)
      sessionIdArray.set(sessionIdBytes)
      offset += sessionIdBytes.length
    }

    // Payload size (4 bytes)
    view.setUint32(offset, payload.byteLength, false)
    offset += 4

    // Payload
    const payloadArray = new Uint8Array(buffer, offset, payload.byteLength)
    if (payload instanceof ArrayBuffer) {
      payloadArray.set(new Uint8Array(payload))
    } else {
      payloadArray.set(payload)
    }

    return buffer
  }

  private handleMessage(data: ArrayBuffer): void {
    try {
      const frame = this.parseBinaryFrame(data)
      
      if (frame.messageType === MessageType.ERROR_INFORMATION) {
        const errorData = JSON.parse(new TextDecoder().decode(frame.payload)) as { error?: string }
        this.notifyError(new Error(errorData.error || 'Server error'))
        return
      }

      // 处理服务端事件
      if (frame.eventType) {
        const eventType = frame.eventType as ServerEventType
        
        let eventData
        if (frame.messageType === MessageType.AUDIO_ONLY_RESPONSE) {
          // 音频数据
          eventData = frame.payload
        } else {
          // JSON数据
          try {
            eventData = JSON.parse(new TextDecoder().decode(frame.payload))
          } catch {
            eventData = frame.payload
          }
        }

        this.notifyEventHandlers(eventType, eventData)
      }

    } catch (error) {
      console.error('Failed to parse message:', error)
      this.notifyError(error as Error)
    }
  }

  private parseBinaryFrame(data: ArrayBuffer): {
    messageType: MessageType
    flags: MessageFlags
    serializationMethod: SerializationMethod
    compressionMethod: CompressionMethod
    eventType?: number
    sessionId?: string
    payload: ArrayBuffer
  } {
    const view = new DataView(data)
    let offset = 0

    // Parse header (4 bytes)
    const header = view.getUint32(offset, false)
    offset += 4

    const protocolVersion = (header & 0xF0000000) >>> 28
    const headerSize = (header & 0x0F000000) >>> 24
    const messageType = (header & 0x00F00000) >>> 20 as MessageType
    const flags = (header & 0x000F0000) >>> 16 as MessageFlags
    const serializationMethod = (header & 0x0000F000) >>> 12 as SerializationMethod
    const compressionMethod = (header & 0x00000F00) >>> 8 as CompressionMethod

    let eventType: number | undefined
    let sessionId: string | undefined

    // Parse optional fields based on flags
    if (flags & MessageFlags.EVENT_ID) {
      eventType = view.getUint32(offset, false)
      offset += 4
    }

    // Parse session ID if present (assuming it's always present for session events)
    if (offset < data.byteLength - 4) {
      try {
        const sessionIdSize = view.getUint32(offset, false)
        offset += 4
        
        if (sessionIdSize > 0 && sessionIdSize < 1000) { // sanity check
          const sessionIdBytes = new Uint8Array(data, offset, sessionIdSize)
          sessionId = new TextDecoder().decode(sessionIdBytes)
          offset += sessionIdSize
        }
      } catch {
        // Session ID parsing failed, continue without it
      }
    }

    // Parse payload size
    const payloadSize = view.getUint32(offset, false)
    offset += 4

    // Parse payload
    const payload = data.slice(offset, offset + payloadSize)

    return {
      messageType,
      flags,
      serializationMethod,
      compressionMethod,
      eventType,
      sessionId,
      payload
    }
  }

  private notifyEventHandlers(eventType: ServerEventType, data: any): void {
    const handlers = this.eventHandlers.get(eventType)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          console.error('Event handler error:', error)
        }
      })
    }
  }

  private notifyError(error: Error): void {
    this.errorHandlers.forEach(handler => {
      try {
        handler(error)
      } catch (err) {
        console.error('Error handler error:', err)
      }
    })
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c == 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  // Getters
  get connected(): boolean {
    return this.isConnected
  }

  get sessionActive(): boolean {
    return this.isSessionActive
  }

  get currentSessionId(): string | null {
    return this.sessionId
  }
}

/**
 * 创建端到端语音客户端的工厂函数
 */
export function createRealtimeVoiceClient(config: RealtimeVoiceConfig): RealtimeVoiceClient {
  return new RealtimeVoiceClient(config)
}