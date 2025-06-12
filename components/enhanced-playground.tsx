"use client"

import { ChatHistory } from "@/components/chat/chat-history"
import { Config } from "@/components/config/config"
import { DebugMonitor } from "@/components/debug-monitor"
import { ErrorDiagnostics } from "@/components/error-diagnostics"
import { ModuleTester } from "@/components/module-tester"
import { QuickDeviceControls } from "@/components/quick-device-controls"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { VoiceSelector } from "@/components/voice-selector"
import { appConfigAtom } from "@/store/app-config"
import { useMicActions, useMicStore } from "@/store/mic"
import { rtcActionsAtom } from "@/store/rtc-actions"
import { rtcConfigAtom } from "@/store/rtc-config"
import { rtcStateAtom } from "@/store/rtc-state"
import { voiceChatStateAtom } from "@/store/voice-chat-state"
import { AnimatePresence, motion, useMotionValue, useAnimation } from "framer-motion"
import { useAtom } from "jotai"
import {
  AlertCircle,
  Bot,
  BotOff,
  Camera,
  CheckCircle,
  Mic,
  MicOff,
  Monitor,
  Phone,
  PhoneOff,
  Play,
  RefreshCw,
  Settings,
  Users,
  Wifi,
  WifiOff,
  X
} from "lucide-react"
import React, { useEffect, useState } from "react"
import { toast } from "sonner"

interface TestResult {
  module: string
  status: "success" | "error" | "testing"
  message: string
  startTime: number
  duration?: number
}

export const EnhancedPlayground: React.FC = () => {
  const [appConfig] = useAtom(appConfigAtom)
  const [config] = useAtom(rtcConfigAtom)
  const [rtcState] = useAtom(rtcStateAtom)
  const [voiceChatState] = useAtom(voiceChatStateAtom)
  const [, dispatchRtcAction] = useAtom(rtcActionsAtom)
  const [isClient, setIsClient] = useState(false)

  // 获取麦克风状态
  const { curMicState } = useMicStore()
  const { toggleMic } = useMicActions()

  // 确保在客户端渲染
  useEffect(() => {
    setIsClient(true)
    
    // 设置拖拽约束
    const updateConstraints = () => {
      if (typeof window !== 'undefined') {
        const windowWidth = window.innerWidth
        const windowHeight = window.innerHeight
        const elementWidth = 256 // w-64 = 256px
        const elementHeight = 300 // 大约高度
        
        setDragConstraints({
          top: -windowHeight + elementHeight - 80, // 保留80px底部空间给控制栏
          left: -windowWidth + elementWidth,
          right: windowWidth - elementWidth,
          bottom: windowHeight - elementHeight - 80,
        })
      }
    }
    
    updateConstraints()
    window.addEventListener('resize', updateConstraints)
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', updateConstraints)
      }
    }
  }, [])

  // 调试状态
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("control")
  const [showFullConfig, setShowFullConfig] = useState(false)

  // 快速配置预设
  const [quickConfig, setQuickConfig] = useState({
    scenario: "default",
    asrMode: appConfig.asr.mode,
    ttsVoice: appConfig.tts.voiceType,
    llmTemp: appConfig.llm.temperature,
  })

  // 设备状态
  const [isCameraEnabled, setIsCameraEnabled] = useState(false)
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null)
  const [dragConstraints, setDragConstraints] = useState({
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  })
  const [isSnapping, setIsSnapping] = useState(false)
  const controls = useAnimation()

  // AI配置
  const [aiConfig, setAiConfig] = useState({
    systemMessage: appConfig.llm.systemMessage,
    welcomeMessage: appConfig.llm.welcomeMessage,
  })

  // 添加调试日志
  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugLogs((prev) => [...prev.slice(-49), `[${timestamp}] ${message}`])
  }

  // 运行模块测试
  const runModuleTest = async (module: string) => {
    const startTime = Date.now()
    const newTest: TestResult = {
      module,
      status: "testing",
      message: "正在测试...",
      startTime,
    }

    setTestResults((prev) => prev.filter((t) => t.module !== module).concat(newTest))
    addDebugLog(`开始测试 ${module}`)

    try {
      switch (module) {
        case "rtc":
          if (!appConfig.rtc.appId || !appConfig.rtc.token) {
            throw new Error("RTC配置不完整")
          }
          // 这里可以添加实际的RTC连接测试
          setTestResults((prev) =>
            prev.map((t) => (t.module === module ? { ...t, status: "success", message: "RTC配置验证通过" } : t))
          )
          break

        case "asr":
          if (!appConfig.asr.appId || !appConfig.asr.accessToken) {
            throw new Error("ASR配置不完整")
          }
          setTestResults((prev) =>
            prev.map((t) => (t.module === module ? { ...t, status: "success", message: "ASR配置验证通过" } : t))
          )
          break

        case "tts":
          if (!appConfig.tts.appId || !appConfig.tts.accessToken) {
            throw new Error("TTS配置不完整")
          }
          setTestResults((prev) =>
            prev.map((t) => (t.module === module ? { ...t, status: "success", message: "TTS配置验证通过" } : t))
          )
          break

        case "llm":
          if (!appConfig.llm.endpointId) {
            throw new Error("LLM配置不完整")
          }
          setTestResults((prev) =>
            prev.map((t) => (t.module === module ? { ...t, status: "success", message: "LLM配置验证通过" } : t))
          )
          break
      }
      const duration = Date.now() - startTime
      setTestResults((prev) => prev.map((t) => (t.module === module ? { ...t, status: "success", duration } : t)))
      addDebugLog(`${module} 测试通过`)
    } catch (error) {
      const duration = Date.now() - startTime
      setTestResults((prev) =>
        prev.map((t) =>
          t.module === module
            ? { ...t, status: "error", message: error instanceof Error ? error.message : "测试失败", duration }
            : t
        )
      )
      addDebugLog(`${module} 测试失败: ${error}`)
    }
  }

  // 快速应用配置
  const applyQuickConfig = () => {
    const bindKey = (key: string) => (value: string) => dispatchRtcAction({ type: "BIND_KEY", payload: { key, value } })

    bindKey("asr.mode")(quickConfig.asrMode)
    bindKey("tts.voiceType")(quickConfig.ttsVoice)
    bindKey("llm.temperature")(quickConfig.llmTemp.toString())

    addDebugLog("应用快速配置")
    toast.success("配置已更新")
  }

  // 初始化引擎
  useEffect(() => {
    if (config && !rtcState.engine) {
      dispatchRtcAction({ type: "INITIALIZE_ENGINE" })
      addDebugLog("初始化RTC引擎")
    }
  }, [config, rtcState.engine, dispatchRtcAction])

  // 监听状态变化添加日志
  useEffect(() => {
    if (rtcState.isConnected) {
      addDebugLog("RTC连接建立")
    }
    if (rtcState.error) {
      addDebugLog(`RTC错误: ${rtcState.error}`)
    }
  }, [rtcState.isConnected, rtcState.error])

  // 摄像头显示时启动动画
  useEffect(() => {
    if ((isCameraEnabled && cameraStream) || cameraError) {
      console.log("Starting camera animation", { isCameraEnabled, cameraStream, cameraError })
      // 延迟一帧确保DOM已渲染
      setTimeout(() => {
        controls.start({ 
          opacity: 1, 
          scale: 1, 
          y: 0,
          x: 0,
          transition: { 
            type: "spring", 
            stiffness: 300, 
            damping: 30,
            duration: 0.2 
          }
        }).then(() => {
          console.log("Camera show animation completed")
        }).catch((err) => {
          console.error("Camera show animation failed:", err)
        })
      }, 10)
    }
  }, [isCameraEnabled, cameraStream, cameraError, controls])

  useEffect(() => {
    if (voiceChatState.isAgentActive) {
      addDebugLog("AI智能体启动")
    }
    if (voiceChatState.error) {
      addDebugLog(`AI错误: ${voiceChatState.error}`)
    }
  }, [voiceChatState.isAgentActive, voiceChatState.error])

  // 处理摄像头流
  useEffect(() => {
    if (videoRef && cameraStream) {
      videoRef.srcObject = cameraStream
      videoRef.play().catch((error) => {
        console.log('Video play failed:', error)
      })
    }
  }, [videoRef, cameraStream])

  // 清理摄像头资源
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [cameraStream])

  // 加入房间
  const handleJoinRoom = async () => {
    addDebugLog("尝试加入房间...")
    dispatchRtcAction({ type: "JOIN_ROOM" })
    setTimeout(() => {
      dispatchRtcAction({ type: "START_LOCAL_AUDIO" })
      addDebugLog("启动本地音频")
    }, 1000)
  }

  // 离开房间
  const handleLeaveRoom = () => {
    addDebugLog("离开房间")
    dispatchRtcAction({ type: "STOP_LOCAL_AUDIO" })
    dispatchRtcAction({ type: "LEAVE_ROOM" })
  }

  // 切换音频 - 使用mic store
  const toggleAudio = () => {
    toggleMic()
    addDebugLog(`麦克风${curMicState.isOn ? "关闭" : "开启"}`)
  }

  // 启动AI智能体
  const handleStartVoiceChat = () => {
    addDebugLog("启动AI智能体...")
    dispatchRtcAction({
      type: "START_VOICE_CHAT",
      systemMessage: aiConfig.systemMessage,
      welcomeMessage: aiConfig.welcomeMessage,
    })
  }

  // 停止AI智能体
  const handleStopVoiceChat = () => {
    addDebugLog("停止AI智能体")
    dispatchRtcAction({ type: "STOP_VOICE_CHAT" })
  }

  // 切换摄像头
  const handleCameraToggle = async () => {
    console.log("Camera toggle clicked", { isCameraEnabled, cameraStream, cameraError })
    addDebugLog(`摄像头切换: 当前状态 ${isCameraEnabled ? "开启" : "关闭"}`)
    
    if (isCameraEnabled) {
      // 关闭摄像头
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop())
        setCameraStream(null)
      }
      setIsCameraEnabled(false)
      setCameraError(null)
      addDebugLog("摄像头关闭")
    } else {
      // 开启摄像头
      setCameraError(null)
      addDebugLog("尝试开启摄像头...")
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
        })
        console.log("Camera stream obtained:", stream)
        setCameraStream(stream)
        setIsCameraEnabled(true)
        addDebugLog("摄像头开启成功")
        toast.success("摄像头已开启")
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "未知错误"
        let userMessage = "摄像头启动失败"

        if (error instanceof Error) {
          if (error.name === "NotAllowedError") {
            userMessage = "摄像头权限被拒绝，请在浏览器设置中允许摄像头访问"
          } else if (error.name === "NotFoundError") {
            userMessage = "未找到摄像头设备"
          } else if (error.name === "NotReadableError") {
            userMessage = "摄像头正在被其他应用使用"
          }
        }

        setCameraError(userMessage)
        addDebugLog(`摄像头启动失败: ${errorMessage}`)
        toast.error(userMessage)
        console.error("Camera access failed:", error)
      }
    }
  }

  // 切换扬声器
  const handleSpeakerToggle = () => {
    setIsSpeakerEnabled(!isSpeakerEnabled)
    addDebugLog(`扬声器${isSpeakerEnabled ? "关闭" : "开启"}`)
  }

  // 磁吸边缘效果
  const snapToEdge = (x: number, y: number) => {
    if (typeof window === 'undefined') return { x, y }
    
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    const elementWidth = 256 // w-64 = 256px
    const elementHeight = 300 // 大约高度
    const snapThreshold = 50 // 距离边缘50px时触发磁吸
    const edgeMargin = 16 // 距离边缘16px
    
    let snapX = x
    let snapY = y
    let shouldSnap = false
    
    // 检查左右边缘
    if (x <= snapThreshold) {
      snapX = -windowWidth + elementWidth + edgeMargin
      shouldSnap = true
    } else if (x >= windowWidth - elementWidth - snapThreshold) {
      snapX = windowWidth - elementWidth - edgeMargin
      shouldSnap = true
    }
    
    // 检查上下边缘
    if (y <= snapThreshold) {
      snapY = -windowHeight + elementHeight + edgeMargin + 80 // 保留顶部空间
      shouldSnap = true
    } else if (y >= windowHeight - elementHeight - snapThreshold - 80) {
      snapY = windowHeight - elementHeight - edgeMargin - 80 // 保留底部控制栏空间
      shouldSnap = true
    }
    
    const snapResult = { x, snapX, y, snapY, shouldSnap, windowWidth, windowHeight }
    console.log("Snap result:", snapResult)
    return snapResult
  }

console.log("Camera:", {isCameraEnabled, cameraStream, cameraError})

  // 防止服务端渲染不匹配
  if (!isClient) {
    return (
      <div className="flex h-full w-full flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto flex h-full items-center justify-center overflow-hidden p-4">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* 顶部状态栏 */}
      <div className="border-b bg-white/90 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-800">语音对话测试台</h1>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  {rtcState.isConnected ? (
                    <Wifi className="h-4 w-4 text-green-500" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-gray-400" />
                  )}
                  <span className={rtcState.isConnected ? "text-green-600" : "text-gray-500"}>
                    {rtcState.isConnected ? "已连接" : "未连接"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {voiceChatState.isAgentActive ? (
                    <Bot className="h-4 w-4 text-green-500" />
                  ) : (
                    <BotOff className="h-4 w-4 text-gray-400" />
                  )}
                  <span className={voiceChatState.isAgentActive ? "text-green-600" : "text-gray-500"}>
                    AI: {voiceChatState.isAgentActive ? "运行" : "停止"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-blue-600">{rtcState.remoteUsers.length} 用户在线</span>
                </div>
              </div>
            </div>

            {/* 主要操作按钮 */}
            <div className="flex items-center gap-2">
              {!rtcState.isConnected ? (
                <Button onClick={handleJoinRoom} disabled={!config} size="sm">
                  <Phone className="mr-2 h-4 w-4" />
                  加入房间
                </Button>
              ) : (
                <>
                  <Button
                    onClick={toggleAudio}
                    variant={curMicState.isOn ? "default" : "secondary"}
                    size="sm"
                    disabled={!curMicState.isPermissionGranted}
                  >
                    {curMicState.isOn ? <Mic className="mr-1 h-3 w-3" /> : <MicOff className="mr-1 h-3 w-3" />}
                    麦克风
                  </Button>
                  {!voiceChatState.isAgentActive ? (
                    <Button onClick={handleStartVoiceChat} disabled={voiceChatState.isStarting} size="sm">
                      <Bot className="mr-2 h-4 w-4" />
                      {voiceChatState.isStarting ? "启动中..." : "启动AI"}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleStopVoiceChat}
                      variant="destructive"
                      disabled={voiceChatState.isStopping}
                      size="sm"
                    >
                      <BotOff className="mr-2 h-4 w-4" />
                      {voiceChatState.isStopping ? "停止中..." : "停止AI"}
                    </Button>
                  )}
                  <Button onClick={handleLeaveRoom} variant="outline" size="sm">
                    <PhoneOff className="mr-1 h-3 w-3" />
                    离开房间
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* 错误提示 */}
          {(rtcState.error || voiceChatState.error) && (
            <Alert variant="destructive" className="mt-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{rtcState.error || voiceChatState.error}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="container mx-auto flex h-full overflow-hidden p-4 pb-20">
        <div className="flex h-full w-full gap-4">
          {/* 左侧边栏 - 配置和控制 */}
          <div className="w-80 flex-shrink-0 overflow-y-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="control" className="flex items-center gap-1">
                  <Bot className="h-3 w-3" />
                  <span className="hidden sm:inline">AI控制</span>
                </TabsTrigger>
                <TabsTrigger value="config" className="flex items-center gap-1">
                  <Settings className="h-3 w-3" />
                  <span className="hidden sm:inline">配置</span>
                </TabsTrigger>
                <TabsTrigger value="debug" className="flex items-center gap-1">
                  <Monitor className="h-3 w-3" />
                  <span className="hidden sm:inline">调试</span>
                </TabsTrigger>
              </TabsList>

              <div className="mt-4 space-y-4">
                {/* AI控制面板 */}
                <TabsContent value="control" className="mt-0 space-y-4">
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
                          onChange={(e) => setAiConfig({ ...aiConfig, systemMessage: e.target.value })}
                          rows={3}
                          className="text-sm"
                          placeholder="定义AI的角色和行为..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">欢迎消息</Label>
                        <Textarea
                          value={aiConfig.welcomeMessage}
                          onChange={(e) => setAiConfig({ ...aiConfig, welcomeMessage: e.target.value })}
                          rows={2}
                          className="text-sm"
                          placeholder="AI的开场白..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">LLM温度: {quickConfig.llmTemp}</Label>
                        <Slider
                          value={[quickConfig.llmTemp]}
                          onValueChange={([value]: number[]) => setQuickConfig({ ...quickConfig, llmTemp: value! })}
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
                            setQuickConfig({ ...quickConfig, asrMode: value as "realtime" | "bigmodel" })
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

                      <Button onClick={applyQuickConfig} className="w-full" size="sm">
                        <RefreshCw className="mr-2 h-3 w-3" />
                        应用配置
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* 详细配置面板 */}
                <TabsContent value="config" className="mt-0">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">快速配置</CardTitle>
                      <CardDescription className="text-sm">常用的配置参数</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* 快速 RTC 配置 */}
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

                      {/* ASR/TTS 快速配置 */}
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

                      {/* LLM 快速配置 */}
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

                      <Button onClick={() => setShowFullConfig(true)} variant="outline" className="w-full" size="sm">
                        <Settings className="mr-2 h-3 w-3" />
                        查看完整配置
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* 调试面板 */}
                <TabsContent value="debug" className="mt-0 space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">模块测试</CardTitle>
                      <CardDescription className="text-sm">测试各个服务模块的连接状态</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {["rtc", "asr", "tts", "llm"].map((module) => {
                          const result = testResults.find((t) => t.module === module)
                          return (
                            <div key={module} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div
                                  className="h-2 w-2 rounded-full"
                                  style={{
                                    backgroundColor:
                                      result?.status === "success"
                                        ? "#10b981"
                                        : result?.status === "error"
                                          ? "#ef4444"
                                          : result?.status === "testing"
                                            ? "#f59e0b"
                                            : "#d1d5db",
                                  }}
                                />
                                <span className="text-sm font-medium uppercase">{module}</span>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => runModuleTest(module)}
                                disabled={result?.status === "testing"}
                                className="h-7 px-2"
                              >
                                <Play className="h-3 w-3" />
                              </Button>
                            </div>
                          )
                        })}
                      </div>

                      {testResults.length > 0 && (
                        <div className="mt-4 max-h-40 space-y-2 overflow-y-auto">
                          <Label className="text-sm font-medium">测试结果</Label>
                          {testResults.slice(-5).map((result, idx) => (
                            <div key={idx} className="rounded bg-gray-50 p-2">
                              <div className="flex items-center gap-1">
                                {result.status === "success" && <CheckCircle className="h-3 w-3 text-green-500" />}
                                {result.status === "error" && <AlertCircle className="h-3 w-3 text-red-500" />}
                                <span className="text-xs font-medium">{result.module}</span>
                              </div>
                              <div className="text-xs text-gray-600">{result.message}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">错误诊断</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ErrorDiagnostics />
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* 主要内容区域 */}
          <div className="flex flex-1 gap-4">
            <ChatHistory />

            {/* 右侧监控面板 */}
            <div className="w-80 flex-shrink-0">
              <div className="h-full space-y-4">
                <DebugMonitor />

                <ModuleTester />

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 摄像头悬浮预览 */}
      <AnimatePresence>
        {((isCameraEnabled && cameraStream) || cameraError) && (
          <motion.div
            className={`fixed bottom-20 right-4 z-50 w-72 rounded-xl bg-white/95 backdrop-blur-md shadow-2xl border ${isSnapping ? 'border-blue-400/50 shadow-blue-200/50' : 'border-white/20'}`}
            drag
            dragMomentum={false}
            dragElastic={0}
            animate={controls}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            style={{
              ...((isCameraEnabled && cameraStream) || cameraError ? {
                opacity: 1,
                transform: 'translateY(0px) scale(1)'
              } : {}),
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
            }}
            onDrag={(event, info) => {
              const { x, y } = info.point
              console.log("onDrag:", { x, y })
              // const snapResult = snapToEdge(x, y)
              
              // // 只在接近边缘时设置isSnapping状态，不干扰位置
              // if (snapResult.shouldSnap && !isSnapping) {
              //   setIsSnapping(true)
              // } else if (!snapResult.shouldSnap && isSnapping) {
              //   setIsSnapping(false)
              // }
            }}
            onDragEnd={async (event, info) => {
              const { x, y } = info.point
              console.log("onDragEnd:", { x, y })
              const snapResult = snapToEdge(x, y)
              
              if (snapResult.shouldSnap) {
                const animation = {
                  x: snapResult.x - x,
                  y: snapResult.y - y,
                  scale: 1.05,
                  transition: {
                    type: "spring",
                    stiffness: 400,
                    damping: 25,
                    duration: 0.3
                  }
                }
                console.log("Animation:", animation)
                setIsSnapping(true)
                // 使用controls平滑移动到吸附位置
                await controls.start(animation)
                // 恢复正常大小
                setTimeout(() => {
                  setIsSnapping(false)
                  controls.start({ scale: 1 })
                }, 300)
              } else {
                setIsSnapping(false)
              }
            }}
          >
            <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 rounded-t-xl border-b border-gray-200/50 cursor-move backdrop-blur-sm">
              <motion.div 
                className="flex items-center gap-2"
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {cameraError ? (
                  <motion.div
                    animate={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                  >
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  </motion.div>
                ) : (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Camera className="h-5 w-5 text-green-600" />
                  </motion.div>
                )}
                <span className="text-sm font-semibold text-gray-700">摄像头预览</span>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCameraToggle}
                  className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600 transition-colors rounded-full"
                >
                  <X className="h-3 w-3" />
                </Button>
              </motion.div>
            </div>
            <motion.div 
              className="p-3 bg-gradient-to-b from-gray-50/50 to-transparent"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {cameraError ? (
                <motion.div 
                  className="text-center py-4"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  </motion.div>
                  <p className="text-sm text-red-600 mb-3">{cameraError}</p>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCameraToggle}
                      className="text-xs"
                    >
                      重试
                    </Button>
                  </motion.div>
                </motion.div>
              ) : (
                <div className="relative">
                  <motion.video
                    ref={setVideoRef}
                    className="w-full rounded-lg bg-black shadow-inner border border-gray-200/30"
                    style={{ aspectRatio: "16/9" }}
                    muted
                    playsInline
                    autoPlay
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                  />
                  <motion.div 
                    className="absolute top-2 right-2 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 px-3 py-1.5 text-xs text-white shadow-lg backdrop-blur-sm"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                  >
                    <motion.div 
                      className="h-2 w-2 rounded-full bg-white"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <span className="font-medium">LIVE</span>
                  </motion.div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 快速设备控制栏 - 底部固定 */}
      <motion.div 
        className="fixed right-0 bottom-0 left-0 z-40"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.5 }}
      >
        <QuickDeviceControls
          isSpeakerEnabled={isSpeakerEnabled}
          isCameraEnabled={isCameraEnabled}
          onSpeakerToggle={handleSpeakerToggle}
          onCameraToggle={handleCameraToggle}
          onDeviceChange={(device) => {
            addDebugLog(`设备切换: ${device.type} -> ${device.deviceId}`)
          }}
        />
      </motion.div>

      {/* 完整配置模态框 */}
      <AnimatePresence>
        {showFullConfig && (
          <motion.div 
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowFullConfig(false)
              }
            }}
          >
            <div className="flex h-full items-center justify-center p-4">
              <motion.div 
                className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-lg bg-white shadow-xl"
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
              >
                <motion.div 
                  className="flex items-center justify-between border-b px-6 py-4"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <div>
                    <h2 className="text-xl font-semibold">完整配置</h2>
                    <p className="text-sm text-gray-600">火山引擎服务的详细配置参数</p>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowFullConfig(false)} 
                      className="rounded-full"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </motion.div>
                <motion.div 
                  className="max-h-[calc(90vh-80px)] overflow-y-auto p-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Config />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
