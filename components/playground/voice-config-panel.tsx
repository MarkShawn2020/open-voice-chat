"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { VoiceSelector } from "@/components/voice-selector"
import { appConfigAtom } from "@/store/app-config"
import { rtcActionsAtom } from "@/store/rtc-actions"
import { useAtom } from "jotai"
import { RefreshCw } from "lucide-react"

interface QuickConfig {
  asrMode: "realtime" | "bigmodel"
  ttsVoice: string
}

interface VoiceConfigPanelProps {
  quickConfig: QuickConfig
  onQuickConfigChange: (config: QuickConfig) => void
  onApplyConfig: () => void
}

export const VoiceConfigPanel: React.FC<VoiceConfigPanelProps> = ({
  quickConfig,
  onQuickConfigChange,
  onApplyConfig,
}) => {
  const [appConfig] = useAtom(appConfigAtom)
  const [, dispatchRtcAction] = useAtom(rtcActionsAtom)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">语音配置</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label className="text-sm font-medium">ASR模式</Label>
          <Select
            value={quickConfig.asrMode}
            onValueChange={(value) =>
              onQuickConfigChange({ ...quickConfig, asrMode: value as "realtime" | "bigmodel" })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="realtime">流式识别</SelectItem>
              <SelectItem value="bigmodel">识别大模型</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">TTS音色</Label>
          <VoiceSelector
            value={appConfig.tts.voiceType}
            onChange={(voiceType) =>
              dispatchRtcAction({ type: "BIND_KEY", payload: { key: "tts.voiceType", value: voiceType } })
            }
            ttsConfig={{
              appId: appConfig.tts.appId,
              accessToken: appConfig.tts.accessToken,
            }}
          />
        </div>

        <Button onClick={onApplyConfig} className="w-full" size="sm">
          <RefreshCw className="mr-2 h-3 w-3" />
          应用配置
        </Button>
      </CardContent>
    </Card>
  )
}