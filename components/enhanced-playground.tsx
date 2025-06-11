"use client"

import { ChatHistory } from "@/components/chat/chat-history"
import { Config } from "@/components/config/config"
import { DebugMonitor } from "@/components/debug-monitor"
import { ErrorDiagnostics } from "@/components/error-diagnostics"
import { ModuleTester } from "@/components/module-tester"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { appConfigAtom } from "@/store/app-config"
import { rtcActionsAtom } from "@/store/rtc-actions"
import { rtcConfigAtom } from "@/store/rtc-config"
import { rtcStateAtom } from "@/store/rtc-state"
import { voiceChatStateAtom } from "@/store/voice-chat-state"
import { useAtom } from "jotai"
import { 
  AlertCircle, 
  Bot, 
  BotOff, 
  CheckCircle,
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  Play,
  RefreshCw,
  TestTube,
  Users, 
  Wifi,
  WifiOff
} from "lucide-react"
import React, { useEffect, useState } from "react"
import { toast } from "sonner"

interface TestResult {
  module: string
  status: "success" | "error" | "testing"
  message: string
  timestamp: number
}

export const EnhancedPlayground: React.FC = () => {
  const [appConfig] = useAtom(appConfigAtom)
  const [config] = useAtom(rtcConfigAtom)
  const [rtcState] = useAtom(rtcStateAtom)
  const [voiceChatState] = useAtom(voiceChatStateAtom)
  const [, dispatchRtcAction] = useAtom(rtcActionsAtom)

  // 调试状态
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("control")
  
  // 快速配置预设
  const [quickConfig, setQuickConfig] = useState({
    scenario: "default",
    asrMode: appConfig.asr.mode,
    ttsVoice: appConfig.tts.voiceType,
    llmTemp: appConfig.llm.temperature,
  })

  // AI配置
  const [aiConfig, setAiConfig] = useState({
    systemMessage: appConfig.llm.systemMessage,
    welcomeMessage: appConfig.llm.welcomeMessage,
  })

  // 添加调试日志
  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugLogs(prev => [...prev.slice(-49), `[${timestamp}] ${message}`])
  }

  // 运行模块测试
  const runModuleTest = async (module: string) => {
    const newTest: TestResult = {
      module,
      status: "testing",
      message: "正在测试...",
      timestamp: Date.now()
    }
    
    setTestResults(prev => prev.filter(t => t.module !== module).concat(newTest))
    addDebugLog(`开始测试 ${module}`)

    try {
      switch (module) {
        case "rtc":
          if (!appConfig.rtc.appId || !appConfig.rtc.token) {
            throw new Error("RTC配置不完整")
          }
          // 这里可以添加实际的RTC连接测试
          setTestResults(prev => prev.map(t => 
            t.module === module 
              ? { ...t, status: "success", message: "RTC配置验证通过" }
              : t
          ))
          break
          
        case "asr":
          if (!appConfig.asr.appId || !appConfig.asr.accessToken) {
            throw new Error("ASR配置不完整")
          }
          setTestResults(prev => prev.map(t => 
            t.module === module 
              ? { ...t, status: "success", message: "ASR配置验证通过" }
              : t
          ))
          break
          
        case "tts":
          if (!appConfig.tts.appId || !appConfig.tts.accessToken) {
            throw new Error("TTS配置不完整")
          }
          setTestResults(prev => prev.map(t => 
            t.module === module 
              ? { ...t, status: "success", message: "TTS配置验证通过" }
              : t
          ))
          break
          
        case "llm":
          if (!appConfig.llm.endpointId) {
            throw new Error("LLM配置不完整")
          }
          setTestResults(prev => prev.map(t => 
            t.module === module 
              ? { ...t, status: "success", message: "LLM配置验证通过" }
              : t
          ))
          break
      }
      addDebugLog(`${module} 测试通过`)
    } catch (error) {
      setTestResults(prev => prev.map(t => 
        t.module === module 
          ? { ...t, status: "error", message: error instanceof Error ? error.message : "测试失败" }
          : t
      ))
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

  useEffect(() => {
    if (voiceChatState.isAgentActive) {
      addDebugLog("AI智能体启动")
    }
    if (voiceChatState.error) {
      addDebugLog(`AI错误: ${voiceChatState.error}`)
    }
  }, [voiceChatState.isAgentActive, voiceChatState.error])

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

  // 切换音频
  const toggleAudio = () => {
    if (rtcState.isLocalAudioEnabled) {
      dispatchRtcAction({ type: "STOP_LOCAL_AUDIO" })
      addDebugLog("停止本地音频")
    } else {
      dispatchRtcAction({ type: "START_LOCAL_AUDIO" })
      addDebugLog("启动本地音频")
    }
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

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto h-full p-4 overflow-hidden">
        <div className="grid h-full grid-cols-1 gap-4 overflow-hidden xl:grid-cols-4">
          
          {/* 左侧：快速控制和配置 */}
          <div className="space-y-4 overflow-y-auto">
            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TestTube className="h-5 w-5 text-blue-600" />
                  调试控制台
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="control">控制</TabsTrigger>
                    <TabsTrigger value="config">配置</TabsTrigger>
                    <TabsTrigger value="test">测试</TabsTrigger>
                  </TabsList>

                  {/* 控制面板 */}
                  <TabsContent value="control" className="space-y-4">
                    {/* 连接状态 */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
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
                        {rtcState.isLocalAudioEnabled ? (
                          <Mic className="h-4 w-4 text-green-500" />
                        ) : (
                          <MicOff className="h-4 w-4 text-gray-400" />
                        )}
                        <span className={rtcState.isLocalAudioEnabled ? "text-green-600" : "text-gray-500"}>
                          麦克风
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span className="text-blue-600">
                          {rtcState.remoteUsers.length} 用户
                        </span>
                      </div>
                    </div>

                    {/* 控制按钮 */}
                    <div className="space-y-2">
                      {!rtcState.isConnected ? (
                        <Button onClick={handleJoinRoom} className="w-full" disabled={!config}>
                          <Phone className="mr-2 h-4 w-4" />
                          加入房间
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              onClick={toggleAudio}
                              variant={rtcState.isLocalAudioEnabled ? "default" : "secondary"}
                              size="sm"
                            >
                              {rtcState.isLocalAudioEnabled ? (
                                <Mic className="mr-1 h-3 w-3" />
                              ) : (
                                <MicOff className="mr-1 h-3 w-3" />
                              )}
                              麦克风
                            </Button>
                            <Button onClick={handleLeaveRoom} variant="destructive" size="sm">
                              <PhoneOff className="mr-1 h-3 w-3" />
                              离开
                            </Button>
                          </div>
                          
                          {!voiceChatState.isAgentActive ? (
                            <Button
                              onClick={handleStartVoiceChat}
                              className="w-full"
                              disabled={voiceChatState.isStarting}
                            >
                              <Bot className="mr-2 h-4 w-4" />
                              {voiceChatState.isStarting ? "启动中..." : "启动AI"}
                            </Button>
                          ) : (
                            <Button
                              onClick={handleStopVoiceChat}
                              className="w-full"
                              variant="destructive"
                              disabled={voiceChatState.isStopping}
                            >
                              <BotOff className="mr-2 h-4 w-4" />
                              {voiceChatState.isStopping ? "停止中..." : "停止AI"}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* AI配置快速调整 */}
                    <div className="space-y-3 border-t pt-3">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">系统消息</Label>
                        <Textarea
                          value={aiConfig.systemMessage}
                          onChange={(e) => setAiConfig({...aiConfig, systemMessage: e.target.value})}
                          rows={2}
                          className="text-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">欢迎消息</Label>
                        <Textarea
                          value={aiConfig.welcomeMessage}
                          onChange={(e) => setAiConfig({...aiConfig, welcomeMessage: e.target.value})}
                          rows={1}
                          className="text-xs"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* 快速配置面板 */}
                  <TabsContent value="config" className="space-y-4">
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">ASR模式</Label>
                        <Select value={quickConfig.asrMode} onValueChange={(value) => 
                          setQuickConfig({...quickConfig, asrMode: value as "realtime" | "bigmodel"})
                        }>
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="realtime">流式识别</SelectItem>
                            <SelectItem value="bigmodel">识别大模型</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-medium">LLM温度: {quickConfig.llmTemp}</Label>
                        <Slider
                          value={[quickConfig.llmTemp]}
                          onValueChange={([value]: number[]) => setQuickConfig({...quickConfig, llmTemp: value!})}
                          min={0}
                          max={2}
                          step={0.1}
                          className="w-full"
                        />
                      </div>

                      <Button onClick={applyQuickConfig} className="w-full" size="sm">
                        <RefreshCw className="mr-2 h-3 w-3" />
                        应用配置
                      </Button>
                    </div>
                  </TabsContent>

                  {/* 测试面板 */}
                  <TabsContent value="test" className="space-y-4">
                    <div className="space-y-2">
                      {["rtc", "asr", "tts", "llm"].map((module) => {
                        const result = testResults.find(t => t.module === module)
                        return (
                          <div key={module} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-gray-300" 
                                   style={{
                                     backgroundColor: result?.status === "success" ? "#10b981" : 
                                                    result?.status === "error" ? "#ef4444" : 
                                                    result?.status === "testing" ? "#f59e0b" : "#d1d5db"
                                   }} />
                              <span className="text-xs font-medium uppercase">{module}</span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => runModuleTest(module)}
                              disabled={result?.status === "testing"}
                              className="h-6 px-2 text-xs"
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                          </div>
                        )
                      })}
                    </div>

                    {testResults.length > 0 && (
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {testResults.slice(-5).map((result, idx) => (
                          <div key={idx} className="text-xs p-2 rounded bg-gray-50">
                            <div className="flex items-center gap-1">
                              {result.status === "success" && <CheckCircle className="h-3 w-3 text-green-500" />}
                              {result.status === "error" && <AlertCircle className="h-3 w-3 text-red-500" />}
                              <span className="font-medium">{result.module}</span>
                            </div>
                            <div className="text-gray-600">{result.message}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* 调试日志 */}
            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">调试日志</CardTitle>
                  <Button size="sm" variant="ghost" onClick={() => setDebugLogs([])}>
                    清空
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {debugLogs.slice(-10).map((log, idx) => (
                    <div key={idx} className="text-xs font-mono text-gray-600 p-1 bg-gray-50 rounded">
                      {log}
                    </div>
                  ))}
                  {debugLogs.length === 0 && (
                    <div className="text-xs text-gray-400 italic">暂无日志</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 模块测试 */}
            <ModuleTester />

            {/* 智能诊断 */}
            <ErrorDiagnostics />

            {/* 错误提示 */}
            {(rtcState.error || voiceChatState.error) && (
              <Alert variant="destructive" className="border-0 shadow-lg">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {rtcState.error || voiceChatState.error}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* 中间：详细配置 */}
          <div className="overflow-y-auto">
            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">详细配置</CardTitle>
                <CardDescription>完整的火山引擎参数配置</CardDescription>
              </CardHeader>
              <CardContent>
                <Config />
              </CardContent>
            </Card>
          </div>

          {/* 右侧：调试监控 */}
          <div className="overflow-y-auto">
            <DebugMonitor />
          </div>

          {/* 最右侧：聊天记录 */}
          <div className="overflow-y-auto">
            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">对话记录</CardTitle>
              </CardHeader>
              <CardContent className="h-full min-h-0">
                <div className="h-full overflow-y-auto">
                  <ChatHistory />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}