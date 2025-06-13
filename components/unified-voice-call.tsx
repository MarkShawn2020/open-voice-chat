"use client"

import { ChatHistory } from "@/components/chat/chat-history"
import { RealtimeChatHistory } from "@/components/chat/realtime-chat-history"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { appConfigAtom } from "@/store/app-config"
import { realtimeVoiceActionsAtom, realtimeVoiceStateAtom } from "@/store/realtime-voice-state"
import { rtcActionsAtom } from "@/store/rtc-actions"
import { rtcConfigAtom } from "@/store/rtc-config"
import { rtcStateAtom } from "@/store/rtc-state"
import { voiceChatStateAtom } from "@/store/voice-chat-state"
import { useAtom } from "jotai"
import { AlertCircle, Bot, BotOff, Mic, MicOff, Phone, PhoneOff, RefreshCw, Settings, Wifi, WifiOff } from "lucide-react"
import React, { useEffect, useState } from "react"

// RTC方案组件
const RTCVoiceMode: React.FC = () => {
  const [config] = useAtom(rtcConfigAtom)
  const [rtcState] = useAtom(rtcStateAtom)
  const [voiceChatState] = useAtom(voiceChatStateAtom)
  const [, dispatchRtcAction] = useAtom(rtcActionsAtom)

  const [aiConfig, setAiConfig] = useState({
    systemMessage: "你是一个友好的AI助手，用简洁明了的方式回答问题。",
    welcomeMessage: "你好！我是你的AI助手，有什么可以帮助你的吗？",
  })

  // 初始化引擎
  useEffect(() => {
    if (config && !rtcState.engine) {
      dispatchRtcAction({ type: "INITIALIZE_ENGINE" })
    }
  }, [config, rtcState.engine, dispatchRtcAction])

  const handleJoinRoom = async () => {
    dispatchRtcAction({ type: "JOIN_ROOM" })
    setTimeout(() => {
      dispatchRtcAction({ type: "START_LOCAL_AUDIO" })
    }, 1000)
  }

  const handleLeaveRoom = () => {
    dispatchRtcAction({ type: "STOP_LOCAL_AUDIO" })
    dispatchRtcAction({ type: "LEAVE_ROOM" })
  }

  const toggleAudio = () => {
    if (rtcState.isLocalAudioEnabled) {
      dispatchRtcAction({ type: "STOP_LOCAL_AUDIO" })
    } else {
      dispatchRtcAction({ type: "START_LOCAL_AUDIO" })
    }
  }

  const handleStartVoiceChat = () => {
    dispatchRtcAction({
      type: "START_VOICE_CHAT",
      systemMessage: aiConfig.systemMessage,
      welcomeMessage: aiConfig.welcomeMessage,
    })
  }

  const handleStopVoiceChat = () => {
    dispatchRtcAction({ type: "STOP_VOICE_CHAT" })
  }

  return (
    <div className="space-y-4">
      {/* RTC 通话控制 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            RTC通话控制
          </CardTitle>
          <CardDescription>
            房间: {config?.roomId || "未配置"} | 用户: {config?.uid || "未配置"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span>连接状态:</span>
              <span className={`font-medium ${rtcState.isConnected ? "text-green-600" : "text-gray-500"}`}>
                {rtcState.isConnected ? "已连接" : "未连接"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>本地音频:</span>
              <span className={`font-medium ${rtcState.isLocalAudioEnabled ? "text-green-600" : "text-gray-500"}`}>
                {rtcState.isLocalAudioEnabled ? "开启" : "关闭"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>远端用户:</span>
              <span className="font-medium">{rtcState.remoteUsers.length} 人</span>
            </div>
            <div className="flex items-center justify-between">
              <span>AI智能体:</span>
              <span className={`font-medium ${voiceChatState.isAgentActive ? "text-green-600" : "text-gray-500"}`}>
                {voiceChatState.isAgentActive ? "运行中" : "未启动"}
              </span>
            </div>
          </div>

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

      {/* AI配置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI配置 (RTC模式)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="systemMessage">系统消息</Label>
            <Textarea
              id="systemMessage"
              value={aiConfig.systemMessage}
              onChange={(e) => setAiConfig({ ...aiConfig, systemMessage: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="welcomeMessage">欢迎消息</Label>
            <Textarea
              id="welcomeMessage"
              value={aiConfig.welcomeMessage}
              onChange={(e) => setAiConfig({ ...aiConfig, welcomeMessage: e.target.value })}
              rows={2}
            />
          </div>

          <div className="flex gap-2">
            {!voiceChatState.isAgentActive ? (
              <Button
                onClick={handleStartVoiceChat}
                className="flex-1"
                disabled={!rtcState.isConnected || voiceChatState.isStarting}
              >
                <Bot className="mr-2 h-4 w-4" />
                {voiceChatState.isStarting ? "启动中..." : "启动AI智能体"}
              </Button>
            ) : (
              <Button
                onClick={handleStopVoiceChat}
                className="flex-1"
                variant="destructive"
                disabled={voiceChatState.isStopping}
              >
                <BotOff className="mr-2 h-4 w-4" />
                {voiceChatState.isStopping ? "停止中..." : "停止AI智能体"}
              </Button>
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

      {voiceChatState.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>AI智能体错误: {voiceChatState.error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

// 端到端实时语音模式组件
const RealtimeVoiceMode: React.FC = () => {
  const [appConfig] = useAtom(appConfigAtom)
  const [realtimeState] = useAtom(realtimeVoiceStateAtom)
  const [, dispatchRealtimeAction] = useAtom(realtimeVoiceActionsAtom)

  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)

  const handleConnect = async () => {
    dispatchRealtimeAction({ type: "CONNECT" })
  }

  const handleDisconnect = async () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop()
    }
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop())
      setAudioStream(null)
    }
    dispatchRealtimeAction({ type: "DISCONNECT" })
  }

  const handleStartSession = async () => {
    dispatchRealtimeAction({ type: "START_SESSION" })
  }

  const handleFinishSession = async () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop()
    }
    dispatchRealtimeAction({ type: "FINISH_SESSION" })
  }

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      })
      
      setAudioStream(stream)

      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=pcm'
      })

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0 && realtimeState.isSessionActive) {
          // 转换为PCM格式并发送
          event.data.arrayBuffer().then(buffer => {
            dispatchRealtimeAction({ type: "SEND_AUDIO", audioData: buffer })
          })
        }
      }

      recorder.start(100) // 每100ms发送一次数据
      setMediaRecorder(recorder)
      dispatchRealtimeAction({ type: "START_RECORDING" })

    } catch (error) {
      console.error("启动录音失败:", error)
      dispatchRealtimeAction({ 
        type: "SET_ERROR", 
        error: "无法访问麦克风，请检查权限设置" 
      })
    }
  }

  const handleStopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop()
    }
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop())
      setAudioStream(null)
    }
    setMediaRecorder(null)
    dispatchRealtimeAction({ type: "STOP_RECORDING" })
  }

  const handleSendText = (text: string) => {
    if (text.trim()) {
      dispatchRealtimeAction({ type: "SEND_TEXT", text: text.trim() })
    }
  }

  return (
    <div className="space-y-4">
      {/* 连接控制 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            端到端语音连接
          </CardTitle>
          <CardDescription>
            直接连接到火山引擎实时语音大模型服务
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span>连接状态:</span>
              <span className={`font-medium ${realtimeState.isConnected ? "text-green-600" : "text-gray-500"}`}>
                {realtimeState.isConnecting ? "连接中..." : realtimeState.isConnected ? "已连接" : "未连接"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>会话状态:</span>
              <span className={`font-medium ${realtimeState.isSessionActive ? "text-green-600" : "text-gray-500"}`}>
                {realtimeState.isStartingSession ? "启动中..." : realtimeState.isSessionActive ? "进行中" : "未开始"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>录音状态:</span>
              <span className={`font-medium ${realtimeState.isRecording ? "text-red-600" : "text-gray-500"}`}>
                {realtimeState.isRecording ? "录音中" : "已停止"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>AI状态:</span>
              <span className={`font-medium ${realtimeState.isSpeaking ? "text-blue-600" : realtimeState.isThinking ? "text-yellow-600" : "text-gray-500"}`}>
                {realtimeState.isSpeaking ? "说话中" : realtimeState.isThinking ? "思考中" : "空闲"}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            {!realtimeState.isConnected ? (
              <Button 
                onClick={handleConnect} 
                className="flex-1" 
                disabled={realtimeState.isConnecting || !appConfig.realtimeVoice.appId || !appConfig.realtimeVoice.accessKey}
              >
                <Wifi className="mr-2 h-4 w-4" />
                {realtimeState.isConnecting ? "连接中..." : "连接服务"}
              </Button>
            ) : (
              <>
                {!realtimeState.isSessionActive ? (
                  <Button onClick={handleStartSession} className="flex-1" disabled={realtimeState.isStartingSession}>
                    <Bot className="mr-2 h-4 w-4" />
                    {realtimeState.isStartingSession ? "启动中..." : "开始会话"}
                  </Button>
                ) : (
                  <>
                    {!realtimeState.isRecording ? (
                      <Button onClick={handleStartRecording} className="flex-1">
                        <Mic className="mr-2 h-4 w-4" />
                        开始录音
                      </Button>
                    ) : (
                      <Button onClick={handleStopRecording} className="flex-1" variant="secondary">
                        <MicOff className="mr-2 h-4 w-4" />
                        停止录音
                      </Button>
                    )}
                    <Button onClick={handleFinishSession} variant="destructive">
                      <BotOff className="mr-2 h-4 w-4" />
                      结束会话
                    </Button>
                  </>
                )}
                <Button onClick={handleDisconnect} variant="outline">
                  <WifiOff className="mr-2 h-4 w-4" />
                  断开连接
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 实时状态显示 */}
      {realtimeState.isSessionActive && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">实时交互</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {realtimeState.userTranscript && (
              <div className="rounded bg-blue-50 p-3">
                <Label className="text-xs text-blue-600">您正在说:</Label>
                <p className="text-sm">{realtimeState.userTranscript}</p>
              </div>
            )}
            
            {realtimeState.assistantText && (
              <div className="rounded bg-green-50 p-3">
                <Label className="text-xs text-green-600">AI回复:</Label>
                <p className="text-sm">{realtimeState.assistantText}</p>
              </div>
            )}

            {/* 快速文本输入 */}
            <div className="border-t pt-3">
              <Label className="text-xs text-gray-600">快速发送文本:</Label>
              <div className="mt-1 flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleSendText("你好")}
                  disabled={!realtimeState.isSessionActive}
                >
                  你好
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleSendText("今天天气怎么样？")}
                  disabled={!realtimeState.isSessionActive}
                >
                  今天天气怎么样？
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleSendText("谢谢")}
                  disabled={!realtimeState.isSessionActive}
                >
                  谢谢
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 错误提示 */}
      {realtimeState.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{realtimeState.error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

// 主组件
export const UnifiedVoiceCall: React.FC = () => {
  const [appConfig, setAppConfig] = useAtom(appConfigAtom)

  const handleVoiceModeChange = (mode: "rtc" | "realtime") => {
    setAppConfig({
      ...appConfig,
      voiceMode: mode
    })
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {/* 方案切换控制 */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            语音方案选择
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">当前方案</Label>
              <p className="text-xs text-gray-600">
                {appConfig.voiceMode === "rtc" 
                  ? "RTC + ASR + TTS + LLM (传统方案)" 
                  : "端到端实时语音大模型 (推荐)"}
              </p>
            </div>
            <Select value={appConfig.voiceMode} onValueChange={handleVoiceModeChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realtime">端到端实时语音大模型</SelectItem>
                <SelectItem value="rtc">RTC传统方案</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid h-full grid-cols-1 gap-6 overflow-hidden lg:grid-cols-2">
        {/* 左侧：控制面板 */}
        <div className="space-y-4 overflow-y-auto">
          {appConfig.voiceMode === "rtc" ? <RTCVoiceMode /> : <RealtimeVoiceMode />}
        </div>

        {/* 右侧：聊天记录 */}
        <div className="h-full min-h-0 overflow-y-auto">
          {appConfig.voiceMode === "rtc" ? (
            <ChatHistory />
          ) : (
            <RealtimeChatHistory />
          )}
        </div>
      </div>
    </div>
  )
}