"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { VoiceSelector } from "@/components/voice-selector"
import { appConfigAtom } from "@/store/app-config"
import { rtcActionsAtom } from "@/store/rtc-actions"
import { useAtom } from "jotai"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface AIConfig {
  systemMessage: string
  welcomeMessage: string
}

interface QuickConfig {
  llmTemp: number
}

interface AIControlPanelProps {
  aiConfig: AIConfig
  quickConfig: QuickConfig
  onAIConfigChange: (config: AIConfig) => void
  onQuickConfigChange: (config: QuickConfig) => void
  onApplyConfig: () => void
}

export const AIControlPanel: React.FC<AIControlPanelProps> = ({
  aiConfig,
  quickConfig,
  onAIConfigChange,
  onQuickConfigChange,
  onApplyConfig,
}) => {
  const [appConfig] = useAtom(appConfigAtom)
  const [, dispatchRtcAction] = useAtom(rtcActionsAtom)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">AI配置</CardTitle>
        <CardDescription className="text-sm">调整AI智能体的行为参数</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">系统消息</Label>
          <Textarea
            value={aiConfig.systemMessage}
            onChange={(e) => onAIConfigChange({ ...aiConfig, systemMessage: e.target.value })}
            rows={3}
            className="text-sm"
            placeholder="定义AI的角色和行为..."
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">欢迎消息</Label>
          <Textarea
            value={aiConfig.welcomeMessage}
            onChange={(e) => onAIConfigChange({ ...aiConfig, welcomeMessage: e.target.value })}
            rows={2}
            className="text-sm"
            placeholder="AI的开场白..."
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">LLM温度: {quickConfig.llmTemp}</Label>
          <Slider
            value={[quickConfig.llmTemp]}
            onValueChange={([value]: number[]) => onQuickConfigChange({ ...quickConfig, llmTemp: value! })}
            min={0}
            max={2}
            step={0.1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>保守</span>
            <span>创造性</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">AI音色</Label>
          <VoiceSelector
            value={appConfig.tts.voiceType}
            onChange={(voiceType) => {
              dispatchRtcAction({ type: "BIND_KEY", payload: { key: "tts.voiceType", value: voiceType } })
              toast.success("音色已更新")
            }}
            ttsConfig={{
              appId: appConfig.tts.appId,
              accessToken: appConfig.tts.accessToken,
            }}
          />
        </div>
      </CardContent>
    </Card>
  )
}