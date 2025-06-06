"use client"

import { useAtom } from "jotai"
import { AlertCircle, Bot, BotOff, Mic, MicOff, Phone, PhoneOff, Users } from "lucide-react"
import React, { useEffect, useState } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { rtcActionsAtom, rtcConfigAtom, rtcStateAtom, voiceChatStateAtom } from "@/store/rtc"


export const VoiceCall: React.FC = () => {
  const [config, setConfig] = useAtom(rtcConfigAtom)
  const [rtcState] = useAtom(rtcStateAtom)
  const [voiceChatState] = useAtom(voiceChatStateAtom)
  const [, dispatchRtcAction] = useAtom(rtcActionsAtom)

  const [aiConfig, setAiConfig] = useState({
    systemMessage: '你是一个友好的AI助手，用简洁明了的方式回答问题。',
    welcomeMessage: '你好！我是你的AI助手，有什么可以帮助你的吗？'
  })



  // 初始化引擎
  useEffect(() => {
    if (config && !rtcState.engine) {
      dispatchRtcAction({ type: "INITIALIZE_ENGINE" })
    }
  }, [config, rtcState.engine, dispatchRtcAction])


  // 加入房间
  const handleJoinRoom = async () => {
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

  // AI配置处理函数
  const handleAiConfigChange = (field: keyof typeof aiConfig) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setAiConfig({ ...aiConfig, [field]: e.target.value })
  }

  // 启动AI智能体
  const handleStartVoiceChat = () => {
    dispatchRtcAction({ 
      type: 'START_VOICE_CHAT',
      systemMessage: aiConfig.systemMessage,
      welcomeMessage: aiConfig.welcomeMessage
    })
  }

  // 停止AI智能体
  const handleStopVoiceChat = () => {
    dispatchRtcAction({ type: 'STOP_VOICE_CHAT' })
  }

  // 基于 userId 精准停止特定的 AI智能体
  const handleStopSpecificVoiceAgent = (userId: string) => {
    // 从用户ID中提取 taskId (格式: voice_agent_${taskId})
    const taskId = userId.replace('voice_agent_', '')
    if (taskId && taskId !== userId) {
      // 直接调用停止API，而不是通过全局状态
      import('@/lib/voice-chat-actions').then(({ stopVoiceChat }) => {
        stopVoiceChat(config.appId, config.roomId, taskId).then((result) => {
          if (result.success) {
            console.log(`成功停止智能体 ${taskId}`)
            // 可以选择性地更新本地状态或重新获取状态
          } else {
            console.error(`停止智能体失败: ${result.error}`)
            dispatchRtcAction({ type: 'SET_ERROR', payload: `停止智能体失败: ${result.error}` })
          }
        })
      })
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-4">

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

      {/* AI配置面板 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI配置
          </CardTitle>
          <CardDescription>配置AI智能体参数</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="systemMessage">系统消息</Label>
            <Textarea
              id="systemMessage"
              value={aiConfig.systemMessage}
              onChange={handleAiConfigChange("systemMessage")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="welcomeMessage">欢迎消息</Label>
            <Textarea
              id="welcomeMessage"
              value={aiConfig.welcomeMessage}
              onChange={handleAiConfigChange("welcomeMessage")}
            />
          </div>

          {/* AI智能体状态 */}
          <div className="flex items-center justify-between">
            <span className="text-sm">AI智能体:</span>
            <span className={`text-sm font-medium ${voiceChatState.isAgentActive ? "text-green-600" : "text-gray-500"}`}>
              {voiceChatState.isAgentActive ? "运行中" : "未启动"}
            </span>
          </div>

          {voiceChatState.taskId && (
            <div className="flex items-center justify-between">
              <span className="text-sm">任务ID:</span>
              <span className="text-xs text-gray-500 font-mono">{voiceChatState.taskId.slice(0, 8)}...</span>
            </div>
          )}

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

      {/* AI状态显示 */}
      {voiceChatState.isAgentActive && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">AI智能体状态</span>
          </div>
          
          {voiceChatState.agentStatus && (
            <div className="rounded bg-blue-50 p-2 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span>思考状态:</span>
                <span className={voiceChatState.agentStatus.isThinking ? "text-yellow-600" : "text-gray-500"}>
                  {voiceChatState.agentStatus.isThinking ? "思考中..." : "空闲"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>说话状态:</span>
                <span className={voiceChatState.agentStatus.isTalking ? "text-green-600" : "text-gray-500"}>
                  {voiceChatState.agentStatus.isTalking ? "说话中..." : "静音"}
                </span>
              </div>
            </div>
          )}
          
          {voiceChatState.subtitle && (
            <div className="rounded bg-gray-50 p-2">
              <div className="text-xs text-gray-500 mb-1">
                {voiceChatState.subtitle.userId} {voiceChatState.subtitle.isDefinite ? "(最终)" : "(实时)"}
              </div>
              <div className="text-sm">{voiceChatState.subtitle.text}</div>
            </div>
          )}
        </div>
      )}

      {/* 错误提示 */}
      {rtcState.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{rtcState.error}</AlertDescription>
        </Alert>
      )}

      {/* AI语音聊天错误提示 */}
      {voiceChatState.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>AI智能体错误: {voiceChatState.error}</AlertDescription>
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
              {rtcState.remoteUsers.map((userId) => {
                const isVoiceAgent = userId.startsWith('voice_agent_')
                const taskId = isVoiceAgent ? userId.replace('voice_agent_', '') : null
                
                return (
                  <div key={userId} className="flex items-center justify-between rounded bg-gray-50 p-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{userId}</div>
                      {isVoiceAgent && taskId && (
                        <div className="text-xs text-gray-500 font-mono">Task: {taskId.slice(0, 8)}...</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-green-600">在线</span>
                      {isVoiceAgent && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStopSpecificVoiceAgent(userId)}
                          className="h-6 px-2 text-xs"
                          title={`停止智能体 ${taskId}`}
                        >
                          <BotOff className="h-3 w-3 mr-1" />
                          下线
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
