// 配置验证函数
import { AppConfig } from "@/store/rtc"

export const validateConfig = (config: AppConfig) => {
  const errors: string[] = []

  if (!config.rtc.appId) errors.push("RTC App ID 不能为空")
  if (!config.rtc.token) errors.push("RTC Token 不能为空")
  if (!config.asr.appId) errors.push("ASR App ID 不能为空")
  if (!config.asr.accessToken) errors.push("ASR Access Token 不能为空")
  if (!config.tts.appId) errors.push("TTS App ID 不能为空")
  if (!config.tts.accessToken) errors.push("TTS Access Token 不能为空")
  if (!config.llm.endpointId) errors.push("LLM Endpoint ID 不能为空")

  return errors
}