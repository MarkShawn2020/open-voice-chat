"use client"

import { useAtom } from "jotai"
import { 
  AlertCircle, Brain, CheckCircle2, Copy, ExternalLink,
  Eye, EyeOff, HelpCircle, Mic, RefreshCw, Server, 
  Settings, Volume2, Zap
} from "lucide-react"
import React, { useState } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { AppConfig, appConfigAtom, rtcActionsAtom, rtcStateAtom } from "@/store/rtc"
import { MicControl } from "./mic"

const VOLCENGINE_GUIDES = {
  rtc: {
    url: "https://console.volcengine.com/rtc/listRTC",
    title: "火山引擎 RTC 控制台",
    description: "获取 App ID、生成 Token"
  },
  speech: {
    url: "https://console.volcengine.com/speech/app",
    title: "火山引擎语音技术控制台", 
    description: "获取 ASR/TTS App ID 和 Access Token"
  },
  llm: {
    url: "https://console.volcengine.com/ark/region:ark+cn-beijing/endpoint",
    title: "火山方舟大模型控制台",
    description: "获取 Endpoint ID"
  }
}

// 配置验证函数
const validateConfig = (config: AppConfig) => {
  const errors: string[] = []
  
  if (!config.rtc.appId) errors.push("RTC App ID 不能为空")
  if (!config.rtc.token) errors.push("RTC Token 不能为空")
  if (!config.asr.appId) errors.push("ASR App ID 不能为空")
  if (!config.asr.accessToken) errors.push("ASR Access Token 不能为空")
  if (!config.tts.appId) errors.push("TTS App ID 不能为空")
  if (!config.tts.accessToken) errors.push("TTS Access Token 不能为空")
  if (!config.llm.endpointId) errors.push("LLM Endpoint ID 不能为空")
  
  return errors
}

// 配置状态组件
const ConfigStatus: React.FC<{ errors: string[] }> = ({ errors }) => {
  const isComplete = errors.length === 0
  
  return (
    <Alert className={isComplete ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}>
      <div className="flex items-center gap-2">
        {isComplete ? (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        ) : (
          <AlertCircle className="h-4 w-4 text-amber-600" />
        )}
        <AlertDescription className={isComplete ? "text-green-800" : "text-amber-800"}>
          {isComplete ? (
            "🎉 配置完成！可以开始语音对话了"
          ) : (
            `还有 ${errors.length} 项配置需要完善`
          )}
        </AlertDescription>
      </div>
    </Alert>
  )
}

// 外部链接组件
const ExternalLinkButton: React.FC<{ 
  title: string
  description: string 
  url: string
}> = ({ title, description, url }) => (
  <Button
    variant="outline"
    size="sm"
    className="h-auto p-3 text-left justify-start"
    onClick={() => window.open(url, '_blank')}
  >
    <div className="flex items-start gap-3">
      <ExternalLink className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
      <div className="space-y-1">
        <div className="font-medium text-sm">{title}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
    </div>
  </Button>
)

// 配置字段组件
const ConfigField: React.FC<{
  label: string
  description?: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'password'
  copyable?: boolean
}> = ({ label, description, placeholder, value, onChange, type = 'text', copyable = false }) => {
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('复制失败:', error)
    }
  }
  
  const inputType = type === 'password' && !showPassword ? 'password' : 'text'
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        {type === 'password' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPassword(!showPassword)}
            className="h-6 px-2"
          >
            {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </Button>
        )}
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      <div className="relative">
        <Input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pr-10"
        />
        {copyable && value && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
          >
            {copied ? (
              <CheckCircle2 className="h-3 w-3 text-green-600" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

export const Config: React.FC = () => {
  const [config, setConfig] = useAtom(appConfigAtom)
  const [rtcState] = useAtom(rtcStateAtom)
  const [, dispatchRtcAction] = useAtom(rtcActionsAtom)

  const [formData, setFormData] = useState<AppConfig>(config)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const configErrors = validateConfig(formData)
  const isConfigComplete = configErrors.length === 0

  // 处理配置更新
  const handleUpdateConfig = () => {
    setConfig(formData)
    dispatchRtcAction({ type: "CLEAR_ERROR" })
  }

  // 表单更新函数
  const updateRtcConfig = (field: keyof AppConfig['rtc']) => (value: string) => {
    setFormData({ ...formData, rtc: { ...formData.rtc, [field]: value } })
  }

  const updateAsrConfig = (field: keyof AppConfig['asr']) => (value: string) => {
    setFormData({ ...formData, asr: { ...formData.asr, [field]: value } })
  }

  const updateTtsConfig = (field: keyof AppConfig['tts']) => (value: string | number) => {
    setFormData({ ...formData, tts: { ...formData.tts, [field]: value } })
  }

  const updateLlmConfig = (field: keyof AppConfig['llm']) => (value: string | number) => {
    setFormData({ ...formData, llm: { ...formData.llm, [field]: value } })
  }

  // 生成Token提示
  const generateTokenHint = () => {
    const { appId, roomId, uid } = formData.rtc
    if (appId && roomId && uid) {
      return `基于 App ID: ${appId}, Room ID: ${roomId}, User ID: ${uid} 生成的 Token`
    }
    return "需要先填写 App ID、Room ID、User ID 后生成 Token"
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {/* 配置状态 */}
      <ConfigStatus errors={configErrors} />

      <Tabs defaultValue="rtc" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="rtc" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            <span className="hidden sm:inline">RTC</span>
          </TabsTrigger>
          <TabsTrigger value="speech" className="flex items-center gap-2">
            <Mic className="h-4 w-4" />
            <span className="hidden sm:inline">语音</span>
          </TabsTrigger>
          <TabsTrigger value="llm" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">大模型</span>
          </TabsTrigger>
          <TabsTrigger value="control" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">控制</span>
          </TabsTrigger>
        </TabsList>

        {/* RTC 配置 */}
        <TabsContent value="rtc" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                实时通信 (RTC) 配置
              </CardTitle>
              <CardDescription>
                配置火山引擎 RTC 服务，用于实时音视频通信
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ExternalLinkButton {...VOLCENGINE_GUIDES.rtc} />
              
              <div className="grid gap-4">
                <ConfigField
                  label="App ID"
                  description="RTC 应用的唯一标识符"
                  placeholder="输入 RTC App ID"
                  value={formData.rtc.appId}
                  onChange={updateRtcConfig('appId')}
                  copyable
                />

                <div className="grid grid-cols-2 gap-4">
                  <ConfigField
                    label="房间ID"
                    description="用户将要加入的房间"
                    placeholder="Room123"
                    value={formData.rtc.roomId}
                    onChange={updateRtcConfig('roomId')}
                  />

                  <ConfigField
                    label="用户ID"
                    description="当前用户的唯一标识"
                    placeholder="User123"
                    value={formData.rtc.uid}
                    onChange={updateRtcConfig('uid')}
                  />
                </div>

                <ConfigField
                  label="Token"
                  description={generateTokenHint()}
                  placeholder="输入或生成 Token"
                  value={formData.rtc.token}
                  onChange={updateRtcConfig('token')}
                  type="password"
                  copyable
                />

                <Alert>
                  <HelpCircle className="h-4 w-4" />
                  <AlertDescription>
                    Token 需要基于 App ID、Room ID、User ID 在控制台生成，用于房间访问权限验证
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 语音配置 */}
        <TabsContent value="speech" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* ASR 配置 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5" />
                  语音识别 (ASR)
                </CardTitle>
                <CardDescription>
                  将语音转换为文字
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ExternalLinkButton {...VOLCENGINE_GUIDES.speech} />
                
                <ConfigField
                  label="App ID"
                  placeholder="输入 ASR App ID"
                  value={formData.asr.appId}
                  onChange={updateAsrConfig('appId')}
                />

                <ConfigField
                  label="Access Token"
                  placeholder="输入 ASR Access Token"
                  value={formData.asr.accessToken}
                  onChange={updateAsrConfig('accessToken')}
                  type="password"
                />
              </CardContent>
            </Card>

            {/* TTS 配置 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5" />
                  文字转语音 (TTS)
                </CardTitle>
                <CardDescription>
                  将文字转换为自然语音
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ExternalLinkButton {...VOLCENGINE_GUIDES.speech} />
                
                <ConfigField
                  label="App ID"
                  placeholder="输入 TTS App ID"
                  value={formData.tts.appId}
                  onChange={updateTtsConfig('appId')}
                />

                <ConfigField
                  label="Access Token"
                  placeholder="输入 TTS Access Token"
                  value={formData.tts.accessToken}
                  onChange={updateTtsConfig('accessToken')}
                  type="password"
                />

                <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-between">
                      高级设置
                      <Settings className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-4">
                    <ConfigField
                      label="声音类型"
                      description="选择 TTS 的音色"
                      placeholder="zh_male_qingshuangnanda_mars_bigtts"
                      value={formData.tts.voiceType}
                      onChange={updateTtsConfig('voiceType')}
                    />

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">语速: {formData.tts.speechRate}</Label>
                      <Slider
                        value={[formData.tts.speechRate]}
                        onValueChange={([value]: number[]) => updateTtsConfig('speechRate')(value)}
                        min={-1}
                        max={1}
                        step={0.1}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">音调: {formData.tts.pitchRate}</Label>
                      <Slider
                        value={[formData.tts.pitchRate]}
                        onValueChange={([value]: number[]) => updateTtsConfig('pitchRate')(value)}
                        min={-1}
                        max={1}
                        step={0.1}
                        className="w-full"
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* LLM 配置 */}
        <TabsContent value="llm" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                大语言模型 (LLM) 配置
              </CardTitle>
              <CardDescription>
                配置 AI 对话的核心引擎
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ExternalLinkButton {...VOLCENGINE_GUIDES.llm} />
              
              <ConfigField
                label="Endpoint ID"
                description="火山方舟大模型的端点标识符"
                placeholder="输入 Endpoint ID (如: ep-20250603102226-lbgst)"
                value={formData.llm.endpointId}
                onChange={updateLlmConfig('endpointId')}
                copyable
              />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">温度: {formData.llm.temperature}</Label>
                  <p className="text-xs text-muted-foreground">控制回答的创造性</p>
                  <Slider
                    value={[formData.llm.temperature]}
                    onValueChange={([value]: number[]) => updateLlmConfig('temperature')(value)}
                    min={0}
                    max={2}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Top P: {formData.llm.topP}</Label>
                  <p className="text-xs text-muted-foreground">控制词汇选择的多样性</p>
                  <Slider
                    value={[formData.llm.topP]}
                    onValueChange={([value]: number[]) => updateLlmConfig('topP')(value)}
                    min={0}
                    max={1}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">最大Token数: {formData.llm.maxTokens}</Label>
                <p className="text-xs text-muted-foreground">单次回答的最大长度</p>
                <Slider
                  value={[formData.llm.maxTokens]}
                  onValueChange={([value]: number[]) => updateLlmConfig('maxTokens')(value)}
                  min={100}
                  max={4000}
                  step={100}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="systemMessage">系统提示</Label>
                <p className="text-xs text-muted-foreground">定义 AI 助手的行为和角色</p>
                <Textarea
                  id="systemMessage"
                  placeholder="你是一个友好的AI助手..."
                  value={formData.llm.systemMessage}
                  onChange={(e) => updateLlmConfig('systemMessage')(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <ConfigField
                label="欢迎消息"
                description="用户开始对话时的第一句话"
                placeholder="你好！我是你的AI助手，有什么可以帮助你的吗？"
                value={formData.llm.welcomeMessage}
                onChange={updateLlmConfig('welcomeMessage')}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 控制面板 */}
        <TabsContent value="control" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  配置管理
                </CardTitle>
                <CardDescription>
                  保存和管理您的配置
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant={isConfigComplete ? "default" : "secondary"}>
                    {isConfigComplete ? "完整" : "未完成"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    配置状态
                  </span>
                </div>

                <Button 
                  onClick={handleUpdateConfig} 
                  className="w-full" 
                  disabled={rtcState.isConnected}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  更新配置
                </Button>

                {!isConfigComplete && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <p>以下配置项需要完善：</p>
                        <ul className="text-xs space-y-1 ml-4">
                          {configErrors.map((error, index) => (
                            <li key={index} className="list-disc">{error}</li>
                          ))}
                        </ul>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  音频控制
                </CardTitle>
                <CardDescription>
                  麦克风和音频设置
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MicControl />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
