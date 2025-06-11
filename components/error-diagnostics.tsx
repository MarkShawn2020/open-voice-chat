"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { appConfigAtom } from "@/store/app-config"
import { rtcStateAtom } from "@/store/rtc-state"
import { voiceChatStateAtom } from "@/store/voice-chat-state"
import { useAtom } from "jotai"
import {
  AlertTriangle,
  Brain,
  CheckCircle,
  Copy,
  ExternalLink,
  HelpCircle,
  Info,
  Lightbulb,
  XCircle
} from "lucide-react"
import React, { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

interface DiagnosticIssue {
  id: string
  severity: "error" | "warning" | "info"
  category: "config" | "connection" | "permission" | "service"
  title: string
  description: string
  suggestions: string[]
  links?: { text: string; url: string }[]
  fixable?: boolean
}

export const ErrorDiagnostics: React.FC = () => {
  const [appConfig] = useAtom(appConfigAtom)
  const [rtcState] = useAtom(rtcStateAtom)
  const [voiceChatState] = useAtom(voiceChatStateAtom)
  const [isClient, setIsClient] = useState(false)

  // 确保在客户端渲染
  useEffect(() => {
    setIsClient(true)
  }, [])

  // 智能诊断逻辑
  const diagnosticIssues = useMemo(() => {
    if (!isClient) return []
    
    const issues: DiagnosticIssue[] = []

    // RTC配置检查
    if (!appConfig.rtc.appId) {
      issues.push({
        id: "rtc-appid-missing",
        severity: "error",
        category: "config",
        title: "RTC App ID 未配置",
        description: "实时通信功能需要有效的App ID才能正常工作",
        suggestions: [
          "前往火山引擎RTC控制台创建应用",
          "复制App ID到配置中",
          "确保App ID格式正确"
        ],
        links: [
          { text: "RTC控制台", url: "https://console.volcengine.com/rtc/listRTC" }
        ],
        fixable: false
      })
    }

    if (!appConfig.rtc.token) {
      issues.push({
        id: "rtc-token-missing",
        severity: "error",
        category: "config",
        title: "RTC Token 未配置",
        description: "Token用于房间访问权限验证，必须正确配置",
        suggestions: [
          "使用RTC控制台生成Token",
          "确保Token未过期",
          "验证Token对应的房间ID和用户ID"
        ],
        links: [
          { text: "Token生成指南", url: "https://console.volcengine.com/rtc/listRTC" }
        ],
        fixable: false
      })
    }

    // ASR配置检查
    if (!appConfig.asr.appId || !appConfig.asr.accessToken) {
      issues.push({
        id: "asr-config-incomplete",
        severity: "error",
        category: "config",
        title: "ASR配置不完整",
        description: "语音识别功能需要App ID和Access Token",
        suggestions: [
          "配置ASR App ID",
          "获取并配置Access Token",
          "根据选择的模式配置相应参数"
        ],
        links: [
          { text: "语音技术控制台", url: "https://console.volcengine.com/speech/app" }
        ],
        fixable: false
      })
    }

    // TTS配置检查
    if (!appConfig.tts.appId || !appConfig.tts.accessToken) {
      issues.push({
        id: "tts-config-incomplete",
        severity: "error",
        category: "config",
        title: "TTS配置不完整",
        description: "文本转语音功能需要App ID和Access Token",
        suggestions: [
          "配置TTS App ID",
          "获取并配置Access Token",
          "选择合适的音色类型"
        ],
        links: [
          { text: "语音技术控制台", url: "https://console.volcengine.com/speech/app" }
        ],
        fixable: false
      })
    }

    // LLM配置检查
    if (!appConfig.llm.endpointId) {
      issues.push({
        id: "llm-endpoint-missing",
        severity: "error",
        category: "config",
        title: "LLM Endpoint ID 未配置",
        description: "大语言模型功能需要有效的端点ID",
        suggestions: [
          "在火山方舟控制台创建端点",
          "复制Endpoint ID到配置中",
          "确保端点状态为可用"
        ],
        links: [
          { text: "火山方舟控制台", url: "https://console.volcengine.com/ark/region:ark+cn-beijing/endpoint" }
        ],
        fixable: false
      })
    }

    // 连接状态检查
    if (rtcState.error) {
      let suggestions = ["检查网络连接", "验证配置参数", "重试连接"]
      
      if (rtcState.error.includes("token")) {
        suggestions = [
          "检查Token是否正确",
          "确认Token未过期",
          "验证Token对应的房间ID和用户ID",
          "重新生成Token"
        ]
      } else if (rtcState.error.includes("network") || rtcState.error.includes("timeout")) {
        suggestions = [
          "检查网络连接",
          "确认防火墙设置",
          "尝试切换网络环境",
          "检查代理设置"
        ]
      }

      issues.push({
        id: "rtc-connection-error",
        severity: "error",
        category: "connection",
        title: "RTC连接错误",
        description: rtcState.error,
        suggestions,
        fixable: true
      })
    }

    // AI智能体错误检查
    if (voiceChatState.error) {
      issues.push({
        id: "ai-agent-error",
        severity: "error",
        category: "service",
        title: "AI智能体错误",
        description: voiceChatState.error,
        suggestions: [
          "检查LLM配置",
          "验证网络连接",
          "重启AI智能体",
          "检查服务状态"
        ],
        fixable: true
      })
    }

    // 权限检查
    if (typeof navigator !== "undefined" && navigator.mediaDevices) {
      // 这里可以添加麦克风权限检查
      // 由于是异步的，这里只是示例
    }

    // 配置冲突检查
    if (appConfig.asr.mode === "realtime" && !appConfig.asr.cluster) {
      issues.push({
        id: "asr-realtime-cluster-missing",
        severity: "warning",
        category: "config",
        title: "实时语音识别Cluster未配置",
        description: "选择实时模式时建议配置Cluster参数",
        suggestions: [
          "配置Cluster参数（默认: volcengine_streaming_common）",
          "或切换到大模型模式"
        ],
        fixable: true
      })
    }

    // 性能建议
    if (appConfig.llm.temperature > 1.5) {
      issues.push({
        id: "llm-high-temperature",
        severity: "info",
        category: "config",
        title: "LLM温度参数较高",
        description: "过高的温度可能导致回答不够稳定",
        suggestions: [
          "考虑降低温度到0.7-1.0区间",
          "根据使用场景调整参数"
        ],
        fixable: true
      })
    }

    return issues
  }, [isClient, appConfig, rtcState.error, voiceChatState.error])

  const getSeverityIcon = (severity: DiagnosticIssue["severity"]) => {
    switch (severity) {
      case "error": return <XCircle className="h-4 w-4 text-red-500" />
      case "warning": return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "info": return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getSeverityColor = (severity: DiagnosticIssue["severity"]) => {
    switch (severity) {
      case "error": return "border-red-200 bg-red-50"
      case "warning": return "border-yellow-200 bg-yellow-50"
      case "info": return "border-blue-200 bg-blue-50"
    }
  }

  const copyDiagnostics = () => {
    const diagnosticText = diagnosticIssues.map(issue => 
      `[${issue.severity.toUpperCase()}] ${issue.title}\n${issue.description}\n解决建议:\n${issue.suggestions.map(s => `- ${s}`).join('\n')}\n`
    ).join('\n---\n\n')
    
    navigator.clipboard.writeText(diagnosticText)
    toast.success("诊断信息已复制到剪贴板")
  }

  const errorCount = diagnosticIssues.filter(i => i.severity === "error").length
  const warningCount = diagnosticIssues.filter(i => i.severity === "warning").length

  // 防止服务端渲染不匹配
  if (!isClient) {
    return (
      <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            智能诊断
          </CardTitle>
          <CardDescription>正在加载...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              智能诊断
            </CardTitle>
            <CardDescription>
              自动检测配置问题并提供解决建议
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {diagnosticIssues.length > 0 && (
              <Button size="sm" variant="outline" onClick={copyDiagnostics}>
                <Copy className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 诊断概览 */}
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="text-center p-2 bg-red-50 rounded">
            <div className="font-medium text-red-600">{errorCount}</div>
            <div className="text-red-500">错误</div>
          </div>
          <div className="text-center p-2 bg-yellow-50 rounded">
            <div className="font-medium text-yellow-600">{warningCount}</div>
            <div className="text-yellow-500">警告</div>
          </div>
          <div className="text-center p-2 bg-green-50 rounded">
            <div className="font-medium text-green-600">
              {diagnosticIssues.length === 0 ? "✓" : diagnosticIssues.filter(i => i.severity === "info").length}
            </div>
            <div className="text-green-500">
              {diagnosticIssues.length === 0 ? "正常" : "建议"}
            </div>
          </div>
        </div>

        {/* 诊断结果 */}
        {diagnosticIssues.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <div className="text-green-600 font-medium">系统状态良好</div>
            <div className="text-gray-500 text-sm">未发现配置或连接问题</div>
          </div>
        ) : (
          <div className="space-y-3">
            {diagnosticIssues.map(issue => (
              <div key={issue.id} className={`p-3 rounded border ${getSeverityColor(issue.severity)}`}>
                <div className="flex items-start gap-3">
                  {getSeverityIcon(issue.severity)}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm mb-1">{issue.title}</div>
                    <div className="text-sm text-gray-600 mb-2">{issue.description}</div>
                    
                    {/* 解决建议 */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs font-medium text-gray-700">
                        <Lightbulb className="h-3 w-3" />
                        解决建议:
                      </div>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {issue.suggestions.map((suggestion, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <span className="text-gray-400">•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* 相关链接 */}
                    {issue.links && issue.links.length > 0 && (
                      <div className="mt-2 flex gap-2">
                        {issue.links.map((link, idx) => (
                          <a
                            key={idx}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {link.text}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 帮助提示 */}
        <Alert className="border-blue-200 bg-blue-50">
          <HelpCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700 text-sm">
            <strong>提示:</strong> 大部分配置问题可以通过访问相应的控制台获取正确的参数值来解决。
            如果问题持续存在，请检查网络连接和防火墙设置。
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}