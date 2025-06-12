export interface TestResult {
  module: string
  status: "success" | "error" | "testing"
  message: string
  startTime: number
  duration?: number
}

export interface AIConfig {
  systemMessage: string
  welcomeMessage: string
}

export interface QuickConfig {
  scenario: string
  asrMode: "realtime" | "bigmodel"
  ttsVoice: string
  llmTemp: number
}