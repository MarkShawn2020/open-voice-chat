"use client"

import { useAtom } from "jotai"
import { AlertCircle, Mic, MicOff, Phone, PhoneOff, Users } from "lucide-react"
import React, { useEffect, useState } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { rtcActionsAtom, RTCConfig, rtcConfigAtom, rtcStateAtom } from "@/store/rtc"


export const VoiceCall: React.FC = () => {
  const [config, setConfig] = useAtom(rtcConfigAtom)
  const [rtcState] = useAtom(rtcStateAtom)
  const [, dispatchRtcAction] = useAtom(rtcActionsAtom)

  const [formData, setFormData] = useState<RTCConfig>(config)



  // 初始化引擎
  useEffect(() => {
    if (config && !rtcState.engine) {
      dispatchRtcAction({ type: "INITIALIZE_ENGINE" })
    }
  }, [config, rtcState.engine, dispatchRtcAction])

  // 处理配置更新
  const handleUpdateConfig = () => {
    if (!formData.appId || !formData.token) {
      dispatchRtcAction({ type: "SET_ERROR", payload: "AppID 和 Token 不能为空" })
      return
    }
    setConfig(formData)
    dispatchRtcAction({ type: "CLEAR_ERROR" })
  }

  // 加入房间
  const handleJoinRoom = async () => {
    if (!config) {
      handleUpdateConfig()
      return
    }

    dispatchRtcAction({ type: "JOIN_ROOM" })

    // 延迟启动音频采集，确保房间连接成功
    setTimeout(() => {
      dispatchRtcAction({ type: "START_LOCAL_AUDIO" })
    }, 1000)
  }

  // 离开房间
  const handleLeaveRoom = () => {
    dispatchRtcAction({ type: "STOP_LOCAL_AUDIO" })
    dispatchRtcAction({ type: "LEAVE_ROOM" })
  }

  // 切换音频
  const toggleAudio = () => {
    if (rtcState.isLocalAudioEnabled) {
      dispatchRtcAction({ type: "STOP_LOCAL_AUDIO" })
    } else {
      dispatchRtcAction({ type: "START_LOCAL_AUDIO" })
    }
  }

  // 表单输入处理函数
  const handleFormChange = (field: keyof RTCConfig) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: e.target.value })
  }

  console.log(formData)

  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      {/* 配置面板 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            语音通话配置
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

      {/* 通话控制面板 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            通话控制
          </CardTitle>
          <CardDescription>
            房间: {config?.roomId || "未配置"} | 用户: {config?.uid || "未配置"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 状态指示器 */}
          <div className="flex items-center justify-between">
            <span className="text-sm">连接状态:</span>
            <span className={`text-sm font-medium ${rtcState.isConnected ? "text-green-600" : "text-gray-500"}`}>
              {rtcState.isConnected ? "已连接" : "未连接"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">本地音频:</span>
            <span
              className={`text-sm font-medium ${rtcState.isLocalAudioEnabled ? "text-green-600" : "text-gray-500"}`}
            >
              {rtcState.isLocalAudioEnabled ? "开启" : "关闭"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">远端用户:</span>
            <span className="text-sm font-medium">{rtcState.remoteUsers.length} 人</span>
          </div>

          {/* 通话控制按钮 */}
          <div className="flex gap-2">
            {!rtcState.isConnected ? (
              <Button onClick={handleJoinRoom} className="flex-1" disabled={!config}>
                <Phone className="mr-2 h-4 w-4" />
                加入房间
              </Button>
            ) : (
              <>
                <Button
                  onClick={toggleAudio}
                  variant={rtcState.isLocalAudioEnabled ? "default" : "secondary"}
                  className="flex-1"
                >
                  {rtcState.isLocalAudioEnabled ? (
                    <Mic className="mr-2 h-4 w-4" />
                  ) : (
                    <MicOff className="mr-2 h-4 w-4" />
                  )}
                  {rtcState.isLocalAudioEnabled ? "麦克风开" : "麦克风关"}
                </Button>

                <Button onClick={handleLeaveRoom} variant="destructive" className="flex-1">
                  <PhoneOff className="mr-2 h-4 w-4" />
                  离开房间
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 错误提示 */}
      {rtcState.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{rtcState.error}</AlertDescription>
        </Alert>
      )}

      {/* 远端用户列表 */}
      {rtcState.remoteUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>在线用户</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {rtcState.remoteUsers.map((userId) => (
                <div key={userId} className="flex items-center justify-between rounded bg-gray-50 p-2">
                  <span className="text-sm">{userId}</span>
                  <span className="text-xs text-green-600">在线</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
