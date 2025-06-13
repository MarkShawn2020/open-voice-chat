"use client"

import { VOLCENGINE_GUIDES } from "@/components/config/config-const"
import { ConfigField } from "@/components/config/config-field"
import { ConfigStatus } from "@/components/config/config-status"
import { ExternalLinkButton } from "@/components/config/external-link-button"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { validateConfig } from "@/components/config/validate-config"
import { appConfigAtom } from "@/store/app-config"

import { rtcActionsAtom } from "@/store/rtc-actions"
import { rtcStateAtom } from "@/store/rtc-state"
import { useAtom } from "jotai"
import { Brain, HelpCircle, Mic, RefreshCw, Server, Settings, Volume2, Wifi } from "lucide-react"
import React, { useState } from "react"
import { toast } from "sonner"

export const Config: React.FC = () => {
  const [config, setConfig] = useAtom(appConfigAtom)
  const [rtcState] = useAtom(rtcStateAtom)
  const [, dispatchRtcAction] = useAtom(rtcActionsAtom)
  const bindKey = (key: string) => (value: string) => dispatchRtcAction({ type: "BIND_KEY", payload: { key, value } })

  const [showAdvanced, setShowAdvanced] = useState(false)

  const configErrors = validateConfig(config)
  const isConfigComplete = configErrors.length === 0

  // 处理配置更新
  const handleUpdateConfig = () => {
    dispatchRtcAction({ type: "CLEAR_ERROR" })
    toast.success("配置更新成功！")
  }

  // 生成Token提示
  const generateTokenHint = () => {
    const { appId, roomId, uid } = config.rtc
    if (appId && roomId && uid) {
      return `基于 App ID: ${appId}, Room ID: ${roomId}, User ID: ${uid} 生成的 Token`
    }
    return "需要先填写 App ID、Room ID、User ID 后生成 Token"
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {/* 方案选择 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            语音方案选择
          </CardTitle>
          <CardDescription>选择使用传统RTC方案还是端到端实时语音大模型方案</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">当前方案</Label>
                <p className="text-xs text-gray-600">
                  {config.voiceMode === "rtc" 
                    ? "RTC + ASR + TTS + LLM (传统方案)" 
                    : "端到端实时语音大模型 (推荐)"}
                </p>
              </div>
              <Select 
                value={config.voiceMode} 
                onValueChange={(value: "rtc" | "realtime") => setConfig({
                  ...config,
                  voiceMode: value
                })}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">端到端实时语音大模型</SelectItem>
                  <SelectItem value="rtc">RTC传统方案</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Alert>
              <HelpCircle className="h-4 w-4" />
              <AlertDescription>
                {config.voiceMode === "realtime" 
                  ? "端到端方案直接连接到火山引擎实时语音大模型，延迟更低，配置更简单。"
                  : "传统RTC方案需要分别配置ASR、TTS和LLM服务，适合需要精细控制的场景。"
                }
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* 配置状态 */}
      <ConfigStatus errors={configErrors} />

      <Tabs defaultValue={config.voiceMode === "realtime" ? "realtime" : "rtc"} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="realtime" className="flex items-center gap-2">
            <Wifi className="h-4 w-4" />
            <span className="hidden sm:inline">端到端语音</span>
          </TabsTrigger>
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
        </TabsList>

        {/* 端到端实时语音大模型配置 */}
        <TabsContent value="realtime" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                端到端实时语音大模型配置
              </CardTitle>
              <CardDescription>
                配置火山引擎端到端实时语音大模型服务，支持语音到语音的直接对话
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ExternalLinkButton 
                title="查看端到端语音大模型文档"
                description="了解如何配置和使用端到端实时语音大模型API"
                url="https://www.volcengine.com/docs/6561/1594356"
              />

              <div className="grid gap-4">
                <ConfigField
                  label="App ID"
                  description="语音大模型应用的唯一标识符"
                  placeholder="输入端到端语音 App ID"
                  value={config.realtimeVoice.appId || ""}
                  onChange={bindKey("realtimeVoice.appId")}
                  copyable
                />

                <ConfigField
                  label="Access Key"
                  description="访问密钥，用于身份验证"
                  placeholder="输入 Access Key"
                  value={config.realtimeVoice.accessKey || ""}
                  onChange={bindKey("realtimeVoice.accessKey")}
                  type="password"
                  copyable
                />

                <div className="grid grid-cols-2 gap-4">
                  <ConfigField
                    label="Resource ID"
                    description="资源标识符"
                    placeholder="volc.speech.dialog"
                    value={config.realtimeVoice.resourceId || ""}
                    onChange={bindKey("realtimeVoice.resourceId")}
                    disabled
                  />

                  <ConfigField
                    label="App Key"
                    description="应用密钥"
                    placeholder="PlgvMymc7f3tQnJ6"
                    value={config.realtimeVoice.appKey || ""}
                    onChange={bindKey("realtimeVoice.appKey")}
                    disabled
                  />
                </div>

                <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Settings className="mr-2 h-4 w-4" />
                      高级设置
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-4">
                    <ConfigField
                      label="连接ID"
                      description="可选的连接追踪标识，用于问题排查"
                      placeholder="自动生成 UUID"
                      value={config.realtimeVoice.connectId || ""}
                      onChange={bindKey("realtimeVoice.connectId")}
                    />

                    <ConfigField
                      label="机器人名称"
                      description="AI助手的显示名称"
                      placeholder="豆包"
                      value={config.realtimeVoice.session.botName || ""}
                      onChange={bindKey("realtimeVoice.session.botName")}
                    />

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>严格审核</Label>
                        <p className="text-xs text-gray-600">开启后会进行更严格的内容审核</p>
                      </div>
                      <Switch
                        checked={config.realtimeVoice.session.strictAudit}
                        onCheckedChange={(checked) => setConfig({
                          ...config,
                          realtimeVoice: {
                            ...config.realtimeVoice,
                            session: {
                              ...config.realtimeVoice.session,
                              strictAudit: checked
                            }
                          }
                        })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>TTS输出格式</Label>
                      <Select
                        value={config.realtimeVoice.session.ttsFormat}
                        onValueChange={(value: "ogg_opus" | "pcm") => setConfig({
                          ...config,
                          realtimeVoice: {
                            ...config.realtimeVoice,
                            session: {
                              ...config.realtimeVoice.session,
                              ttsFormat: value
                            }
                          }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ogg_opus">OGG Opus (推荐)</SelectItem>
                          <SelectItem value="pcm">PCM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {config.realtimeVoice.session.ttsFormat === "pcm" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>采样率</Label>
                          <Select
                            value={config.realtimeVoice.session.pcmConfig.sampleRate?.toString() || "24000"}
                            onValueChange={(value) => setConfig({
                              ...config,
                              realtimeVoice: {
                                ...config.realtimeVoice,
                                session: {
                                  ...config.realtimeVoice.session,
                                  pcmConfig: {
                                    channel: config.realtimeVoice.session.pcmConfig.channel,
                                    sampleRate: parseInt(value)
                                  }
                                }
                              }
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="16000">16000 Hz</SelectItem>
                              <SelectItem value="24000">24000 Hz</SelectItem>
                              <SelectItem value="48000">48000 Hz</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>声道数</Label>
                          <Select
                            value={config.realtimeVoice.session.pcmConfig.channel?.toString() || "1"}
                            onValueChange={(value) => setConfig({
                              ...config,
                              realtimeVoice: {
                                ...config.realtimeVoice,
                                session: {
                                  ...config.realtimeVoice.session,
                                  pcmConfig: {
                                    sampleRate: config.realtimeVoice.session.pcmConfig.sampleRate,
                                    channel: parseInt(value)
                                  }
                                }
                              }
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">单声道</SelectItem>
                              <SelectItem value="2">立体声</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>

                <Alert>
                  <HelpCircle className="h-4 w-4" />
                  <AlertDescription>
                    端到端实时语音大模型需要在火山引擎控制台申请开通，并获取相应的App ID和Access Key。
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* RTC 配置 */}
        <TabsContent value="rtc" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                实时通信 (RTC) 配置
              </CardTitle>
              <CardDescription>配置火山引擎 RTC 服务，用于实时音视频通信</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ExternalLinkButton {...VOLCENGINE_GUIDES.rtc} />

              <div className="grid gap-4">
                <ConfigField
                  label="App ID"
                  description="RTC 应用的唯一标识符"
                  placeholder="输入 RTC App ID"
                  value={config.rtc.appId || ""}
                  onChange={bindKey("rtc.appId")}
                  copyable
                />

                <div className="grid grid-cols-2 gap-4">
                  <ConfigField
                    label="房间ID"
                    description="用户将要加入的房间"
                    placeholder="Room123"
                    value={config.rtc.roomId || ""}
                    onChange={bindKey("rtc.roomId")}
                  />

                  <ConfigField
                    label="用户ID"
                    description="当前用户的唯一标识"
                    placeholder="User123"
                    value={config.rtc.uid || ""}
                    onChange={bindKey("rtc.uid")}
                  />
                </div>

                <ConfigField
                  label="Token"
                  description={generateTokenHint()}
                  placeholder="输入或生成 Token"
                  value={config.rtc.token || ""}
                  onChange={bindKey("rtc.token")}
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
                <CardDescription>将语音转换为文字</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ExternalLinkButton {...VOLCENGINE_GUIDES.speech} />

                <div className="space-y-2">
                  <Label htmlFor="asr-mode">语音识别模式</Label>
                  <Select
                    value={config.asr.mode}
                    onValueChange={bindKey("asr.mode")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="选择语音识别模式" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realtime">流式语音识别（实时）</SelectItem>
                      <SelectItem value="bigmodel">流式语音识别大模型</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <ConfigField
                  label="App ID"
                  placeholder="输入 ASR App ID"
                  value={config.asr.appId || ""}
                  onChange={bindKey("asr.appId")}
                />

                {config.asr.mode === "realtime" ? (
                  <ConfigField
                    label="Cluster"
                    placeholder="默认：volcengine_streaming_common"
                    value={config.asr.cluster || ""}
                    onChange={bindKey("asr.cluster")}
                    description="控制台地址：https://console.volcengine.com/speech/service/16"
                  />
                ) : (
                  <ConfigField
                    label="Access Token"
                    placeholder="输入 Access Token"
                    value={config.asr.accessToken || ""}
                    onChange={bindKey("asr.accessToken")}
                    type="password"
                    description="控制台地址：https://console.volcengine.com/speech/service/10011"
                  />
                )}
              </CardContent>
            </Card>

            {/* TTS 配置 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5" />
                  文字转语音 (TTS)
                </CardTitle>
                <CardDescription>将文字转换为自然语音</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ExternalLinkButton {...VOLCENGINE_GUIDES.speech} />

                <ConfigField
                  label="App ID"
                  placeholder="输入 TTS App ID"
                  value={config.tts.appId || ""}
                  onChange={bindKey("tts.appId")}
                />

                <ConfigField
                  label="Access Token"
                  placeholder="输入 TTS Access Token"
                  value={config.tts.accessToken || ""}
                  onChange={bindKey("tts.accessToken")}
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
                      value={config.tts.voiceType || ""}
                      onChange={bindKey("tts.voiceType")}
                    />

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">语速: {config.tts.speechRate}</Label>
                      <p className="text-muted-foreground text-xs">控制语音的播放速度</p>
                      <Slider
                        value={[config.tts.speechRate]}
                        onValueChange={([value]: number[]) => bindKey("tts.speechRate")(value!.toString())}
                        min={-1}
                        max={1}
                        step={0.1}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">音调: {config.tts.pitchRate}</Label>
                      <p className="text-muted-foreground text-xs">控制语音的音调</p>
                      <Slider
                        value={[config.tts.pitchRate]}
                        onValueChange={([value]: number[]) => bindKey("tts.pitchRate")(value!.toString())}
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
              <CardDescription>配置 AI 对话的核心引擎</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ExternalLinkButton {...VOLCENGINE_GUIDES.llm} />

              <ConfigField
                label="Endpoint ID"
                description="火山方舟大模型的端点标识符"
                placeholder="输入 Endpoint ID (如: ep-20250603102226-lbgst)"
                value={config.llm.endpointId || ""}
                onChange={bindKey("llm.endpointId")}
                copyable
              />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">温度: {config.llm.temperature}</Label>
                  <p className="text-muted-foreground text-xs">控制回答的创造性</p>
                  <Slider
                    value={[config.llm.temperature]}
                    onValueChange={([value]: number[]) => bindKey("llm.temperature")(value!.toString())}
                    min={0}
                    max={2}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Top P: {config.llm.topP}</Label>
                  <p className="text-muted-foreground text-xs">控制词汇选择的多样性</p>
                  <Slider
                    value={[config.llm.topP]}
                    onValueChange={([value]: number[]) => bindKey("llm.topP")(value!.toString())}
                    min={0}
                    max={1}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">最大Token数: {config.llm.maxTokens}</Label>
                <p className="text-muted-foreground text-xs">单次回答的最大长度</p>
                <Slider
                  value={[config.llm.maxTokens]}
                  onValueChange={([value]: number[]) => bindKey("llm.maxTokens")(value!.toString())}
                  min={100}
                  max={4000}
                  step={100}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="systemMessage">系统提示</Label>
                <p className="text-muted-foreground text-xs">定义 AI 助手的行为和角色</p>
                <Textarea
                  id="systemMessage"
                  placeholder="你是一个友好的AI助手..."
                  value={config.llm.systemMessage || ""}
                  onChange={(e) => bindKey("llm.systemMessage")(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <ConfigField
                label="欢迎消息"
                description="用户开始对话时的第一句话"
                placeholder="你好！我是你的AI助手，有什么可以帮助你的吗？"
                value={config.llm.welcomeMessage || ""}
                onChange={bindKey("llm.welcomeMessage")}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Button onClick={handleUpdateConfig} className="w-full" disabled={rtcState.isConnected}>
        <RefreshCw className="mr-2 h-4 w-4" />
        更新配置
      </Button>
    </div>
  )
}
