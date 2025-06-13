// 应用配置 - 包含所有服务的配置
import { atomWithStorage,createJSONStorage } from "jotai/utils"

export interface AppConfig {
  // 语音方案选择
  voiceMode: "rtc" | "realtime" // rtc: 原有的RTC+ASR+TTS+LLM方案, realtime: 端到端实时语音大模型方案

  // RTC 配置
  rtc: {
    appId: string
    roomId: string
    uid: string
    token: string
  }

  // ASR (语音识别) 配置
  asr: {
    appId: string
    accessToken: string
    cluster: string
    mode: "realtime" | "bigmodel"
  }

  // TTS (文本转语音) 配置
  tts: {
    appId: string
    accessToken: string
    voiceType: string
    speechRate: number
    pitchRate: number
  }

  // LLM (大语言模型) 配置
  llm: {
    endpointId: string
    temperature: number
    maxTokens: number
    topP: number
    systemMessage: string
    welcomeMessage: string
  }

  // 端到端实时语音大模型配置
  realtimeVoice: {
    appId: string
    accessKey: string
    resourceId: string // 固定值: volc.speech.dialog
    appKey: string // 固定值: PlgvMymc7f3tQnJ6
    connectId?: string
    // 会话配置
    session: {
      botName: string
      strictAudit: boolean
      // TTS输出格式配置
      ttsFormat: "ogg_opus" | "pcm" // ogg_opus: 默认格式, pcm: PCM格式
      pcmConfig: {
        channel: number
        sampleRate: number
      }
    }
  }
}

// 默认应用配置
export const defaultAppConfig: AppConfig = {
  voiceMode: "realtime", // 默认使用端到端实时语音大模型方案
  rtc: {
    appId: "",
    roomId: "Room123",
    uid: "User123",
    token: "",
  },
  asr: {
    appId: "",
    accessToken: "",
    cluster: "volcengine_streaming_common",
    mode: "bigmodel",
  },
  tts: {
    appId: "",
    accessToken: "",
    voiceType: "zh_male_qingshuangnanda_mars_bigtts",
    speechRate: 0,
    pitchRate: 0,
  },
  llm: {
    endpointId: "",
    temperature: 0.7,
    maxTokens: 1024,
    topP: 0.8,
    systemMessage: "你是一个友好的AI助手，用简洁明了的方式回答问题。",
    welcomeMessage: "你好！我是你的AI助手，有什么可以帮助你的吗？",
  },
  realtimeVoice: {
    appId: "",
    accessKey: "",
    resourceId: "volc.speech.dialog",
    appKey: "PlgvMymc7f3tQnJ6",
    session: {
      botName: "豆包",
      strictAudit: true,
      ttsFormat: "ogg_opus",
      pcmConfig: {
        channel: 1,
        sampleRate: 24000
      }
    }
  },
}
// 初始状态
const defaultStorageMechanism = createJSONStorage<AppConfig>()
const storageMechanism = {
  ...defaultStorageMechanism,
  getItem(key: string, initialValue: unknown): AppConfig {
    try {
      const storedValue = localStorage.getItem(key)
      if(key === 'appConfig') {
        const value = JSON.parse(storedValue ?? "") as AppConfig
        // migrate old rtc config to new voiceMode and realtimeVoice
        if(value.rtc && !value.voiceMode) {
          value.voiceMode = "realtime"
          value.realtimeVoice = {
            appId: value.rtc.appId,
            accessKey: value.rtc.token,
            resourceId: "volc.speech.dialog",
            appKey: "PlgvMymc7f3tQnJ6",
            session: {
              botName: "豆包",
              strictAudit: true,
              ttsFormat: "ogg_opus",
              pcmConfig: {
                channel: 1,
                sampleRate: 24000
              }
            }
          }
          localStorage.setItem(key, JSON.stringify(value));
        }
          return value
      }
      return JSON.parse(storedValue ?? "") as AppConfig
    }
    catch (error) {
      console.error(`Error getting item from storage for key "${key}":`, error)
      return initialValue as AppConfig
    }
  },
}
export const appConfigAtom = atomWithStorage<AppConfig>(
  "appConfig", defaultAppConfig, storageMechanism, { getOnInit: true })