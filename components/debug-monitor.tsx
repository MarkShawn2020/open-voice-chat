"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { appConfigAtom } from "@/store/app-config"
import { rtcStateAtom } from "@/store/rtc-state"
import { voiceChatStateAtom } from "@/store/voice-chat-state"
import { useAtom } from "jotai"
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Copy, 
  Download,
  Info, 
  Trash2, 
  XCircle 
} from "lucide-react"
import React, { useEffect, useState } from "react"
import { toast } from "sonner"

interface LogEntry {
  id: string
  timestamp: number
  level: "info" | "warn" | "error" | "debug"
  category: "rtc" | "asr" | "tts" | "llm" | "system"
  message: string
  details?: Record<string, unknown>
}

interface PerformanceMetric {
  name: string
  value: number
  unit: string
  status: "good" | "warning" | "error"
  threshold?: { warning: number; error: number }
}

export const DebugMonitor: React.FC = () => {
  const [appConfig] = useAtom(appConfigAtom)
  const [rtcState] = useAtom(rtcStateAtom)
  const [voiceChatState] = useAtom(voiceChatStateAtom)
  const [isClient, setIsClient] = useState(false)

  // 确保在客户端渲染
  useEffect(() => {
    setIsClient(true)
  }, [])

  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([])
  const [logFilter, setLogFilter] = useState<string>("all")
  const [performance, setPerformance] = useState<PerformanceMetric[]>([])
  const [, ] = useState<Record<string, unknown>>({})

  // 添加日志条目
  const addLog = (level: LogEntry["level"], category: LogEntry["category"], message: string, details?: Record<string, unknown>) => {
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const newLog: LogEntry = {
      id: `${timestamp}-${randomSuffix}`,
      timestamp,
      level,
      category,
      message,
      details
    }
    
    setLogs(prev => {
      const updated = [...prev, newLog]
      // 保持最新的1000条日志
      return updated.slice(-1000)
    })
  }

  // 监听状态变化并记录日志
  useEffect(() => {
    if (rtcState.isConnected) {
      addLog("info", "rtc", "RTC连接建立", { roomId: appConfig.rtc.roomId, uid: appConfig.rtc.uid })
    } else if (rtcState.error) {
      addLog("error", "rtc", `RTC连接错误: ${rtcState.error}`)
    }
  }, [rtcState.isConnected, rtcState.error, appConfig.rtc.roomId, appConfig.rtc.uid])

  useEffect(() => {
    if (rtcState.isLocalAudioEnabled) {
      addLog("info", "rtc", "本地音频已启用")
    } else {
      addLog("info", "rtc", "本地音频已停用")
    }
  }, [rtcState.isLocalAudioEnabled])

  useEffect(() => {
    if (voiceChatState.isAgentActive) {
      addLog("info", "system", "AI智能体启动", { taskId: voiceChatState.taskId })
    } else if (voiceChatState.error) {
      addLog("error", "system", `AI智能体错误: ${voiceChatState.error}`)
    }
  }, [voiceChatState.isAgentActive, voiceChatState.error, voiceChatState.taskId])

  useEffect(() => {
    rtcState.remoteUsers.forEach(userId => {
      addLog("info", "rtc", `用户加入: ${userId}`)
    })
  }, [rtcState.remoteUsers.length])

  // 过滤日志
  useEffect(() => {
    if (logFilter === "all") {
      setFilteredLogs(logs)
    } else {
      setFilteredLogs(logs.filter(log => log.category === logFilter || log.level === logFilter))
    }
  }, [logs, logFilter])

  // 模拟性能指标更新
  useEffect(() => {
    const interval = setInterval(() => {
      const newMetrics: PerformanceMetric[] = [
        {
          name: "网络延迟",
          value: Math.random() * 100 + 20,
          unit: "ms",
          status: "good",
          threshold: { warning: 100, error: 200 }
        },
        {
          name: "音频质量",
          value: Math.random() * 20 + 80,
          unit: "%",
          status: "good",
          threshold: { warning: 70, error: 50 }
        },
        {
          name: "CPU使用率",
          value: Math.random() * 60 + 20,
          unit: "%",
          status: "good",
          threshold: { warning: 70, error: 90 }
        },
        {
          name: "内存使用",
          value: Math.random() * 40 + 30,
          unit: "MB",
          status: "good",
          threshold: { warning: 100, error: 200 }
        }
      ]

      // 根据阈值设置状态
      newMetrics.forEach(metric => {
        if (metric.threshold) {
          if (metric.name === "音频质量") {
            // 音频质量越高越好
            if (metric.value < metric.threshold.error) metric.status = "error"
            else if (metric.value < metric.threshold.warning) metric.status = "warning"
            else metric.status = "good"
          } else {
            // 其他指标越低越好
            if (metric.value > metric.threshold.error) metric.status = "error"
            else if (metric.value > metric.threshold.warning) metric.status = "warning"
            else metric.status = "good"
          }
        }
      })

      setPerformance(newMetrics)
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  // 导出日志
  const exportLogs = () => {
    const logData = logs.map(log => ({
      timestamp: new Date(log.timestamp).toISOString(),
      level: log.level,
      category: log.category,
      message: log.message,
      details: log.details
    }))

    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `debug-logs-${new Date().getTime()}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("日志已导出")
  }

  // 清空日志
  const clearLogs = () => {
    setLogs([])
    toast.success("日志已清空")
  }

  // 复制日志
  const copyLogs = () => {
    const logText = filteredLogs.map(log => 
      `[${new Date(log.timestamp).toLocaleTimeString()}] [${log.level.toUpperCase()}] [${log.category.toUpperCase()}] ${log.message}`
    ).join("\n")
    
    navigator.clipboard.writeText(logText)
    toast.success("日志已复制到剪贴板")
  }

  const getLogIcon = (level: LogEntry["level"]) => {
    switch (level) {
      case "error": return <XCircle className="h-3 w-3 text-red-500" />
      case "warn": return <AlertTriangle className="h-3 w-3 text-yellow-500" />
      case "info": return <Info className="h-3 w-3 text-blue-500" />
      case "debug": return <Activity className="h-3 w-3 text-gray-500" />
    }
  }

  const getStatusColor = (status: PerformanceMetric["status"]) => {
    switch (status) {
      case "good": return "text-green-600"
      case "warning": return "text-yellow-600"
      case "error": return "text-red-600"
    }
  }

  return (
    <Card className="">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">调试监控</CardTitle>
            <CardDescription>实时状态监控和日志记录</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={copyLogs}>
              <Copy className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="outline" onClick={exportLogs}>
              <Download className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="outline" onClick={clearLogs}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-full min-h-0">
        <Tabs defaultValue="logs" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="logs">日志</TabsTrigger>
            <TabsTrigger value="performance">性能</TabsTrigger>
            <TabsTrigger value="status">状态</TabsTrigger>
          </TabsList>

          <TabsContent value="logs" className="flex-1 min-h-0">
            <div className="space-y-3 h-full flex flex-col">
              {/* 日志过滤器 */}
              <div className="flex gap-1 flex-wrap">
                {["all", "error", "warn", "info", "rtc", "system"].map(filter => (
                  <Button
                    key={filter}
                    size="sm"
                    variant={logFilter === filter ? "default" : "outline"}
                    onClick={() => setLogFilter(filter)}
                  >
                    {filter === "all" ? "全部" : filter.toUpperCase()}
                  </Button>
                ))}
              </div>

              {/* 日志列表 */}
              <ScrollArea className="flex-1 rounded border">
                <div className="p-2 space-y-1">
                  {filteredLogs.slice(-100).reverse().map(log => (
                    <div key={log.id} className="text-xs p-2 rounded bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        {getLogIcon(log.level)}
                        <span className="font-mono text-gray-500">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {log.category.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-gray-700">{log.message}</div>
                      {log.details && (
                        <div className="mt-1 p-1 bg-gray-100 rounded text-gray-600 font-mono text-xs">
                          {JSON.stringify(log.details, null, 2)}
                        </div>
                      )}
                    </div>
                  ))}
                  {filteredLogs.length === 0 && (
                    <div className="text-center text-gray-400 py-8">
                      暂无日志
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="flex-1 min-h-0">
            <div className="space-y-4">
              {performance.map(metric => (
                <div key={metric.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{metric.name}</span>
                    <span className={`text-sm font-mono ${getStatusColor(metric.status)}`}>
                      {metric.value.toFixed(1)} {metric.unit}
                    </span>
                  </div>
                  <Progress 
                    value={metric.name === "音频质量" ? metric.value : Math.min(metric.value, 100)} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="status" className="flex-1 min-h-0">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">连接状态</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>RTC连接:</span>
                      <div className="flex items-center gap-1">
                        {rtcState.isConnected ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-red-500" />
                        )}
                        <span className={rtcState.isConnected ? "text-green-600" : "text-red-600"}>
                          {rtcState.isConnected ? "已连接" : "未连接"}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span>本地音频:</span>
                      <span className={rtcState.isLocalAudioEnabled ? "text-green-600" : "text-gray-500"}>
                        {rtcState.isLocalAudioEnabled ? "开启" : "关闭"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>远端用户:</span>
                      <span className="text-blue-600">{rtcState.remoteUsers.length}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">AI状态</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>智能体:</span>
                      <div className="flex items-center gap-1">
                        {voiceChatState.isAgentActive ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-gray-400" />
                        )}
                        <span className={voiceChatState.isAgentActive ? "text-green-600" : "text-gray-500"}>
                          {voiceChatState.isAgentActive ? "运行中" : "未启动"}
                        </span>
                      </div>
                    </div>
                    {voiceChatState.taskId && (
                      <div className="flex justify-between">
                        <span>任务ID:</span>
                        <span className="font-mono text-xs text-gray-500">
                          {voiceChatState.taskId.slice(0, 8)}...
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">配置概览</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-gray-50 rounded">
                    <div className="font-medium">ASR</div>
                    <div className="text-gray-600">{appConfig.asr.mode}</div>
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                    <div className="font-medium">LLM</div>
                    <div className="text-gray-600">温度: {appConfig.llm.temperature}</div>
                  </div>
                </div>
              </div>

              {rtcState.remoteUsers.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">在线用户</h4>
                  <div className="space-y-1">
                    {rtcState.remoteUsers.map(userId => (
                      <div key={userId} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                        <span className="font-mono">{userId}</span>
                        <Badge variant="outline" className="text-xs">
                          在线
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}