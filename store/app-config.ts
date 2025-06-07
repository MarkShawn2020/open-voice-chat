// 应用配置 - 包含所有服务的配置
import { atomWithStorage } from "jotai/utils"

export interface AppConfig {
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
}

// 默认应用配置
export const defaultAppConfig: AppConfig = {
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
}
// 初始状态
export const appConfigAtom = atomWithStorage<AppConfig>("appConfig", defaultAppConfig, undefined, { getOnInit: true })