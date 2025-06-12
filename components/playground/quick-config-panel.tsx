"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { appConfigAtom } from "@/store/app-config"
import { rtcActionsAtom } from "@/store/rtc-actions"
import { useAtom } from "jotai"
import { Settings } from "lucide-react"

interface QuickConfigPanelProps {
  onShowFullConfig: () => void
}

export const QuickConfigPanel: React.FC<QuickConfigPanelProps> = ({
  onShowFullConfig,
}) => {
  const [appConfig] = useAtom(appConfigAtom)
  const [, dispatchRtcAction] = useAtom(rtcActionsAtom)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">快速配置</CardTitle>
        <CardDescription className="text-sm">常用的配置参数</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <Label className="text-sm font-medium">RTC 连接</Label>
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-xs text-gray-600">App ID</Label>
              <input
                type="text"
                className="w-full rounded-md border px-3 py-1.5 text-sm"
                value={appConfig.rtc.appId || ""}
                onChange={(e) =>
                  dispatchRtcAction({
                    type: "BIND_KEY",
                    payload: { key: "rtc.appId", value: e.target.value },
                  })
                }
                placeholder="RTC App ID"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">房间ID</Label>
                <input
                  type="text"
                  className="w-full rounded-md border px-2 py-1.5 text-xs"
                  value={appConfig.rtc.roomId || ""}
                  onChange={(e) =>
                    dispatchRtcAction({
                      type: "BIND_KEY",
                      payload: { key: "rtc.roomId", value: e.target.value },
                    })
                  }
                  placeholder="Room123"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">用户ID</Label>
                <input
                  type="text"
                  className="w-full rounded-md border px-2 py-1.5 text-xs"
                  value={appConfig.rtc.uid || ""}
                  onChange={(e) =>
                    dispatchRtcAction({
                      type: "BIND_KEY",
                      payload: { key: "rtc.uid", value: e.target.value },
                    })
                  }
                  placeholder="User123"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3 border-t pt-3">
          <Label className="text-sm font-medium">语音服务</Label>
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-xs text-gray-600">ASR App ID</Label>
              <input
                type="text"
                className="w-full rounded-md border px-3 py-1.5 text-sm"
                value={appConfig.asr.appId || ""}
                onChange={(e) =>
                  dispatchRtcAction({
                    type: "BIND_KEY",
                    payload: { key: "asr.appId", value: e.target.value },
                  })
                }
                placeholder="ASR App ID"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-600">TTS App ID</Label>
              <input
                type="text"
                className="w-full rounded-md border px-3 py-1.5 text-sm"
                value={appConfig.tts.appId || ""}
                onChange={(e) =>
                  dispatchRtcAction({
                    type: "BIND_KEY",
                    payload: { key: "tts.appId", value: e.target.value },
                  })
                }
                placeholder="TTS App ID"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3 border-t pt-3">
          <Label className="text-sm font-medium">大模型配置</Label>
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-xs text-gray-600">Endpoint ID</Label>
              <input
                type="text"
                className="w-full rounded-md border px-3 py-1.5 text-sm"
                value={appConfig.llm.endpointId || ""}
                onChange={(e) =>
                  dispatchRtcAction({
                    type: "BIND_KEY",
                    payload: { key: "llm.endpointId", value: e.target.value },
                  })
                }
                placeholder="ep-xxxxx"
              />
            </div>
          </div>
        </div>

        <Button onClick={onShowFullConfig} variant="outline" className="w-full" size="sm">
          <Settings className="mr-2 h-3 w-3" />
          查看完整配置
        </Button>
      </CardContent>
    </Card>
  )
}