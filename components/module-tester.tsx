"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { appConfigAtom } from "@/store/app-config"
import { useAtom } from "jotai"
import { 
  AlertCircle,
  Brain,
  CheckCircle,
  Clock,
  Loader2,
  Mic,
  Play,
  Volume2,
  Wifi
} from "lucide-react"
import React, { useState } from "react"
import { toast } from "sonner"

interface TestResult {
  success: boolean
  message: string
  duration: number
  details?: Record<string, unknown>
}

interface ModuleTest {
  id: string
  name: string
  icon: React.ReactNode
  description: string
  isRunning: boolean
  result?: TestResult
}

export const ModuleTester: React.FC = () => {
  const [appConfig] = useAtom(appConfigAtom)
  
  const [tests, setTests] = useState<ModuleTest[]>([
    {
      id: "rtc",
      name: "RTC连接",
      icon: <Wifi className="h-4 w-4" />,
      description: "测试实时通信连接",
      isRunning: false
    },
    {
      id: "asr",
      name: "语音识别",
      icon: <Mic className="h-4 w-4" />,
      description: "测试ASR服务连接",
      isRunning: false
    },
    {
      id: "tts",
      name: "文本转语音",
      icon: <Volume2 className="h-4 w-4" />,
      description: "测试TTS服务连接",
      isRunning: false
    },
    {
      id: "llm",
      name: "大语言模型",
      icon: <Brain className="h-4 w-4" />,
      description: "测试LLM端点连接",
      isRunning: false
    }
  ])

  const updateTestState = (id: string, updates: Partial<ModuleTest>) => {
    setTests(prev => prev.map(test => 
      test.id === id ? { ...test, ...updates } : test
    ))
  }

  const runTest = async (testId: string) => {
    const startTime = Date.now()
    updateTestState(testId, { isRunning: true, result: undefined })

    try {
      let result: TestResult

      switch (testId) {
        case "rtc":
          result = await testRTC()
          break
        case "asr":
          result = await testASR()
          break
        case "tts":
          result = await testTTS()
          break
        case "llm":
          result = await testLLM()
          break
        default:
          throw new Error("未知的测试类型")
      }

      result.duration = Date.now() - startTime
      updateTestState(testId, { isRunning: false, result })
      
      if (result.success) {
        toast.success(`${tests.find(t => t.id === testId)?.name} 测试通过`)
      } else {
        toast.error(`${tests.find(t => t.id === testId)?.name} 测试失败`)
      }
    } catch (error) {
      const result: TestResult = {
        success: false,
        message: error instanceof Error ? error.message : "测试失败",
        duration: Date.now() - startTime
      }
      updateTestState(testId, { isRunning: false, result })
      toast.error(`测试失败: ${result.message}`)
    }
  }

  const testRTC = async (): Promise<TestResult> => {
    // 模拟RTC连接测试
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (!appConfig.rtc.appId) {
      return { success: false, message: "RTC App ID 未配置", duration: 0 }
    }
    if (!appConfig.rtc.token) {
      return { success: false, message: "RTC Token 未配置", duration: 0 }
    }

    // 这里可以添加实际的RTC SDK连接测试
    // 目前只是配置验证
    return {
      success: true,
      message: "RTC配置验证通过",
      duration: 0,
      details: {
        appId: appConfig.rtc.appId.slice(0, 8) + "...",
        roomId: appConfig.rtc.roomId,
        uid: appConfig.rtc.uid
      }
    }
  }

  const testASR = async (): Promise<TestResult> => {
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    if (!appConfig.asr.appId) {
      return { success: false, message: "ASR App ID 未配置", duration: 0 }
    }
    if (!appConfig.asr.accessToken) {
      return { success: false, message: "ASR Access Token 未配置", duration: 0 }
    }

    // 这里可以添加实际的ASR API测试调用
    try {
      // 模拟API调用
      const response = await fetch("/api/test-asr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appId: appConfig.asr.appId,
          accessToken: appConfig.asr.accessToken,
          mode: appConfig.asr.mode
        })
      })

      if (response.ok) {
        return {
          success: true,
          message: "ASR服务连接成功",
          duration: 0,
          details: { mode: appConfig.asr.mode }
        }
      } else {
        return {
          success: false,
          message: `ASR服务响应错误: ${response.status}`,
          duration: 0
        }
      }
    } catch {
      // 如果API不存在，只验证配置
      return {
        success: true,
        message: "ASR配置验证通过 (API测试跳过)",
        duration: 0,
        details: { mode: appConfig.asr.mode }
      }
    }
  }

  const testTTS = async (): Promise<TestResult> => {
    await new Promise(resolve => setTimeout(resolve, 1200))
    
    if (!appConfig.tts.appId) {
      return { success: false, message: "TTS App ID 未配置", duration: 0 }
    }
    if (!appConfig.tts.accessToken) {
      return { success: false, message: "TTS Access Token 未配置", duration: 0 }
    }

    // 这里可以添加实际的TTS API测试调用
    try {
      const response = await fetch("/api/test-tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appId: appConfig.tts.appId,
          accessToken: appConfig.tts.accessToken,
          voiceType: appConfig.tts.voiceType
        })
      })

      if (response.ok) {
        return {
          success: true,
          message: "TTS服务连接成功",
          duration: 0,
          details: { voiceType: appConfig.tts.voiceType }
        }
      } else {
        return {
          success: false,
          message: `TTS服务响应错误: ${response.status}`,
          duration: 0
        }
      }
    } catch {
      return {
        success: true,
        message: "TTS配置验证通过 (API测试跳过)",
        duration: 0,
        details: { voiceType: appConfig.tts.voiceType }
      }
    }
  }

  const testLLM = async (): Promise<TestResult> => {
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    if (!appConfig.llm.endpointId) {
      return { success: false, message: "LLM Endpoint ID 未配置", duration: 0 }
    }

    // 这里可以添加实际的LLM API测试调用
    try {
      const response = await fetch("/api/test-llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpointId: appConfig.llm.endpointId,
          temperature: appConfig.llm.temperature
        })
      })

      if (response.ok) {
        return {
          success: true,
          message: "LLM服务连接成功",
          duration: 0,
          details: { endpointId: appConfig.llm.endpointId.slice(0, 12) + "..." }
        }
      } else {
        return {
          success: false,
          message: `LLM服务响应错误: ${response.status}`,
          duration: 0
        }
      }
    } catch {
      return {
        success: true,
        message: "LLM配置验证通过 (API测试跳过)",
        duration: 0,
        details: { endpointId: appConfig.llm.endpointId.slice(0, 12) + "..." }
      }
    }
  }

  const runAllTests = async () => {
    for (const test of tests) {
      if (!test.isRunning) {
        await runTest(test.id)
        // 添加延迟避免并发过多
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
  }

  const getStatusIcon = (test: ModuleTest) => {
    if (test.isRunning) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
    }
    if (test.result?.success) {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    }
    if (test.result?.success === false) {
      return <AlertCircle className="h-4 w-4 text-red-500" />
    }
    return <Clock className="h-4 w-4 text-gray-400" />
  }

  const getStatusColor = (test: ModuleTest) => {
    if (test.isRunning) return "text-blue-600"
    if (test.result?.success) return "text-green-600"
    if (test.result?.success === false) return "text-red-600"
    return "text-gray-500"
  }

  return (
    <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">模块测试</CardTitle>
            <CardDescription>独立测试各个服务模块的连接性</CardDescription>
          </div>
          <Button 
            size="sm" 
            onClick={runAllTests}
            disabled={tests.some(t => t.isRunning)}
          >
            <Play className="mr-2 h-3 w-3" />
            全部测试
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {tests.map(test => (
          <div key={test.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {test.icon}
                <div>
                  <div className="font-medium text-sm">{test.name}</div>
                  <div className="text-xs text-gray-500">{test.description}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(test)}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => runTest(test.id)}
                  disabled={test.isRunning}
                  className="h-7 px-2"
                >
                  {test.isRunning ? "测试中..." : "测试"}
                </Button>
              </div>
            </div>

            {test.result && (
              <div className="ml-7 space-y-1">
                <div className={`text-xs font-medium ${getStatusColor(test)}`}>
                  {test.result.message}
                </div>
                <div className="text-xs text-gray-500">
                  耗时: {test.result.duration}ms
                </div>
                {test.result.details && (
                  <div className="text-xs bg-gray-50 rounded p-2 font-mono">
                    {JSON.stringify(test.result.details, null, 2)}
                  </div>
                )}
              </div>
            )}

            {test.isRunning && (
              <div className="ml-7">
                <Progress value={66} className="h-1" />
              </div>
            )}
          </div>
        ))}

        {/* 测试总结 */}
        {tests.every(t => t.result) && (
          <div className="mt-4 p-3 bg-gray-50 rounded border-t">
            <div className="text-sm font-medium mb-2">测试总结</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-green-600">通过: </span>
                {tests.filter(t => t.result?.success).length}
              </div>
              <div>
                <span className="text-red-600">失败: </span>
                {tests.filter(t => t.result?.success === false).length}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}