"use client"

import { useAtom } from "jotai"
import { Settings } from "lucide-react"
import React, { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { rtcActionsAtom, RTCConfig, rtcConfigAtom, rtcStateAtom } from "@/store/rtc"
import { MicControl } from "./mic"

export const Config: React.FC = () => {
  const [config, setConfig] = useAtom(rtcConfigAtom)
  const [rtcState] = useAtom(rtcStateAtom)
  const [, dispatchRtcAction] = useAtom(rtcActionsAtom)

  const [formData, setFormData] = useState<RTCConfig>(config)

  // 处理配置更新
  const handleUpdateConfig = () => {
    if (!formData.appId || !formData.token) {
      dispatchRtcAction({ type: "SET_ERROR", payload: "AppID 和 Token 不能为空" })
      return
    }
    setConfig(formData)
    dispatchRtcAction({ type: "CLEAR_ERROR" })
  }

  // 表单输入处理函数
  const handleFormChange = (field: keyof RTCConfig) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: e.target.value })
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      {/* 配置面板 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            RTC 配置
          </CardTitle>
          <CardDescription>配置火山引擎RTC参数</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="appId">App ID</Label>
            <Input
              id="appId"
              type="text"
              placeholder="输入 App ID"
              value={formData.appId}
              onChange={handleFormChange("appId")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="token">Token</Label>
            <Input
              id="token"
              type="text"
              placeholder="输入 Token"
              value={formData.token}
              onChange={handleFormChange("token")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="roomId">房间ID</Label>
              <Input id="roomId" type="text" value={formData.roomId} onChange={handleFormChange("roomId")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="uid">用户ID</Label>
              <Input id="uid" type="text" value={formData.uid} onChange={handleFormChange("uid")} />
            </div>
          </div>

          <Button onClick={handleUpdateConfig} className="w-full" disabled={rtcState.isConnected}>
            更新配置
          </Button>
        </CardContent>
      </Card>

      <MicControl />

    </div>
  )
}
