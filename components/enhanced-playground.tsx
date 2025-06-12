"use client"

import { ChatHistory } from "@/components/chat/chat-history"
import { DebugMonitor } from "@/components/debug-monitor"
import { ErrorDiagnostics } from "@/components/error-diagnostics"
import { ModuleTester } from "@/components/module-tester"
import { AIControlPanel } from "@/components/playground/ai-control-panel"
import { CameraPreview } from "@/components/playground/camera-preview"
import { PersonDetection } from "@/components/person-detection"
import { ConfigModal } from "@/components/playground/config-modal"
import { DebugPanel } from "@/components/playground/debug-panel"
import { MainControls } from "@/components/playground/main-controls"
import { QuickConfigPanel } from "@/components/playground/quick-config-panel"
import { StatusBar } from "@/components/playground/status-bar"
import { AIConfig, QuickConfig, TestResult } from "@/components/playground/types"
import { VoiceConfigPanel } from "@/components/playground/voice-config-panel"
import { PersonDetectionConfigPanel } from "@/components/playground/person-detection-config-panel"
import { QuickDeviceControls } from "@/components/quick-device-controls"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { appConfigAtom } from "@/store/app-config"
import { useMicActions, useMicStore } from "@/store/mic"
import { rtcActionsAtom } from "@/store/rtc-actions"
import { rtcConfigAtom } from "@/store/rtc-config"
import { rtcStateAtom } from "@/store/rtc-state"
import { voiceChatStateAtom } from "@/store/voice-chat-state"
import { AnimatePresence, motion, useMotionValue, useAnimation } from "framer-motion"
import { useAtom } from "jotai"
import {
  Bot,
  Monitor,
  Settings,
} from "lucide-react"
import React, { useEffect, useState } from "react"
import { toast } from "sonner"


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
  const [quickConfig, setQuickConfig] = useState<QuickConfig>({
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
  
  // 人员检测状态
  const [isPersonDetectionEnabled, setIsPersonDetectionEnabled] = useState(false)
  
  // 当前选择的摄像头设备ID
  const [selectedCameraId, setSelectedCameraId] = useState<string>("")
  const [personDetectionConfig, setPersonDetectionConfig] = useState({
    detectionInterval: 200,
    minConfidence: 0.6,
    maxPersons: 10,
    motionSensitivity: 0.4,
    attentionSensitivity: 0.7,
    interactionSensitivity: 0.5,
    enableFaceRecognition: true,
    enablePoseDetection: true
  })
  const [personDetectionStats, setPersonDetectionStats] = useState({
    totalDetections: 0,
    averageStayDuration: 0,
    maxSimultaneousPersons: 0,
    lookingAtCameraCount: 0,
    interactingCount: 0
  })
  const [dragConstraints, setDragConstraints] = useState({
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  })
  const [isSnapping, setIsSnapping] = useState(false)
  const controls = useAnimation()

  // AI配置
  const [aiConfig, setAiConfig] = useState<AIConfig>({
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
        const constraints: MediaStreamConstraints = {
          video: {
            deviceId: selectedCameraId ? { exact: selectedCameraId } : undefined,
            width: 640,
            height: 480
          }
        }
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        console.log("Camera stream obtained:", stream)
        setCameraStream(stream)
        setIsCameraEnabled(true)
        
        // 如果没有选择特定设备，记录实际使用的设备
        if (!selectedCameraId) {
          const videoTrack = stream.getVideoTracks()[0]
          if (videoTrack && videoTrack.getSettings().deviceId) {
            setSelectedCameraId(videoTrack.getSettings().deviceId || "")
          }
        }
        
        addDebugLog("摄像头开启成功")
        // toast.success("摄像头已开启")
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

  // 切换人员检测
  const handlePersonDetectionToggle = () => {
    if (!isCameraEnabled) {
      toast.error("请先启用摄像头")
      return
    }
    setIsPersonDetectionEnabled(!isPersonDetectionEnabled)
    addDebugLog(`人员检测${isPersonDetectionEnabled ? "关闭" : "开启"}`)
  }

  // 人员检测回调
  const handlePersonEntered = (personId: string) => {
    addDebugLog(`新人员进入: ${personId}`)
  }

  const handlePersonLeft = (personId: string) => {
    addDebugLog(`人员离开: ${personId}`)
  }

  // 人员检测配置更新
  const handlePersonDetectionConfigChange = (newConfig: Partial<typeof personDetectionConfig>) => {
    setPersonDetectionConfig(prev => ({ ...prev, ...newConfig }))
  }

  // 重置人员检测统计
  const handleResetPersonDetectionStats = () => {
    setPersonDetectionStats({
      totalDetections: 0,
      averageStayDuration: 0,
      maxSimultaneousPersons: 0,
      lookingAtCameraCount: 0,
      interactingCount: 0
    })
  }

  // 切换摄像头设备
  const handleCameraDeviceChange = async (deviceId: string) => {
    if (!isCameraEnabled) return
    
    addDebugLog(`切换摄像头设备: ${deviceId}`)
    setSelectedCameraId(deviceId)
    
    try {
      // 停止当前摄像头流
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop())
      }
      
      // 启动新的摄像头流
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: 640,
          height: 480
        }
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      setCameraStream(stream)
      setCameraError(null)
      addDebugLog(`摄像头切换成功: ${deviceId}`)
      toast.success("摄像头已切换")
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "未知错误"
      setCameraError(`摄像头切换失败: ${errorMessage}`)
      addDebugLog(`摄像头切换失败: ${errorMessage}`)
      toast.error("摄像头切换失败")
      console.error("Camera device change failed:", error)
    }
  }

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
      <StatusBar>
        <MainControls
          onJoinRoom={handleJoinRoom}
          onLeaveRoom={handleLeaveRoom}
          onToggleAudio={toggleAudio}
          onStartVoiceChat={handleStartVoiceChat}
          onStopVoiceChat={handleStopVoiceChat}
        />
      </StatusBar>

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
                <TabsContent value="control" className="mt-0 space-y-4">
                  <AIControlPanel
                    aiConfig={aiConfig}
                    llmTemp={quickConfig.llmTemp}
                    onAIConfigChange={setAiConfig}
                    onLLMTempChange={(temp) => setQuickConfig({ ...quickConfig, llmTemp: temp })}
                    onApplyConfig={applyQuickConfig}
                  />

                  <VoiceConfigPanel
                    asrMode={quickConfig.asrMode}
                    onASRModeChange={(mode) => setQuickConfig({ ...quickConfig, asrMode: mode })}
                    onApplyConfig={applyQuickConfig}
                  />

                  <PersonDetectionConfigPanel
                    enabled={isPersonDetectionEnabled}
                    isRunning={isPersonDetectionEnabled}
                    config={personDetectionConfig}
                    stats={personDetectionStats}
                    onToggle={handlePersonDetectionToggle}
                    onConfigChange={handlePersonDetectionConfigChange}
                    onResetStats={handleResetPersonDetectionStats}
                    cameraEnabled={isCameraEnabled}
                  />
                </TabsContent>

                <TabsContent value="config" className="mt-0">
                  <QuickConfigPanel onShowFullConfig={() => setShowFullConfig(true)} />
                </TabsContent>

                <TabsContent value="debug" className="mt-0 space-y-4">
                  <DebugPanel 
                    testResults={testResults}
                    onRunModuleTest={runModuleTest}
                  />

                  <div className="p-4 rounded bg-white border">
                    <ErrorDiagnostics />
                  </div>
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

      <div className="relative">
        <CameraPreview
          isCameraEnabled={isCameraEnabled}
          cameraStream={cameraStream}
          cameraError={cameraError}
          onCameraToggle={handleCameraToggle}
          onVideoRef={setVideoRef}
        />
        
        {/* 人员检测覆盖层 */}
        {isCameraEnabled && cameraStream && videoRef && (
          <PersonDetection
            videoElement={videoRef}
            enabled={isPersonDetectionEnabled}
            showOverlay={true}
            showPanel={false}
            onPersonEntered={handlePersonEntered}
            onPersonLeft={handlePersonLeft}
          />
        )}
      </div>

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
          isPersonDetectionEnabled={isPersonDetectionEnabled}
          onSpeakerToggle={handleSpeakerToggle}
          onCameraToggle={handleCameraToggle}
          onPersonDetectionToggle={handlePersonDetectionToggle}
          onDeviceChange={(device) => {
            addDebugLog(`设备切换: ${device.type} -> ${device.deviceId}`)
            if (device.type === 'camera') {
              handleCameraDeviceChange(device.deviceId)
            }
          }}
        />
      </motion.div>

      <ConfigModal
        isOpen={showFullConfig}
        onClose={() => setShowFullConfig(false)}
      />
    </div>
  )
}
