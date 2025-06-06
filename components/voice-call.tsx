"use client"

import { useAtom } from "jotai"
import { AlertCircle, Bot, BotOff, MessageCircle, Mic, MicOff, Phone, PhoneOff, Users } from "lucide-react"
import React, { useEffect, useRef, useState } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ChatMessage, rtcActionsAtom, rtcConfigAtom, rtcStateAtom, voiceChatStateAtom } from "@/store/rtc"

// 时间戳组件
const TimeStamp: React.FC<{ timestamp: number }> = ({ timestamp }) => {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    
    if (messageDate.getTime() === today.getTime()) {
      // 今天：显示时分
      return date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit'
      })
    } else if (messageDate.getTime() === today.getTime() - 24 * 60 * 60 * 1000) {
      // 昨天
      return `昨天 ${date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit'
      })}`
    } else {
      // 更早：显示月日和时分
      return date.toLocaleString('zh-CN', { 
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit', 
        minute: '2-digit'
      })
    }
  }

  return (
    <div className="flex justify-center my-4">
      <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
        {formatTime(timestamp)}
      </span>
    </div>
  )
}

// 聊天消息组件
const ChatMessageItem: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const [, dispatchRtcAction] = useAtom(rtcActionsAtom)
  const isUser = message.role === 'user'
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 })

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenuPosition({ x: e.clientX, y: e.clientY })
    setShowContextMenu(true)
  }

  const handleDeleteMessage = () => {
    dispatchRtcAction({ type: 'DELETE_CHAT_MESSAGE', messageId: message.id })
    setShowContextMenu(false)
  }

  const handleClickOutside = () => {
    setShowContextMenu(false)
  }

  useEffect(() => {
    if (showContextMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showContextMenu])

  return (
    <>
      <div 
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`}
        onContextMenu={handleContextMenu}
      >
        <div className={`max-w-[75%] rounded-2xl px-3 py-2 cursor-pointer select-text relative ${
          isUser 
            ? `bg-blue-500 text-white ${!message.isComplete ? 'opacity-70' : ''}` 
            : `bg-white border text-gray-900 ${!message.isComplete ? 'opacity-70' : ''}`
        }`}>
          <div className="text-sm break-words leading-relaxed">{message.content}</div>
          
        </div>
      </div>
      
      {/* 右键菜单 */}
      {showContextMenu && (
        <div 
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px]"
          style={{ left: contextMenuPosition.x, top: contextMenuPosition.y }}
        >
          <Button
            onClick={handleDeleteMessage}
            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            🗑️ 删除消息
          </Button>
        </div>
      )}
    </>
  )
}

// 聊天记录组件
const ChatHistory: React.FC<{ messages: ChatMessage[] }> = ({ messages }) => {
  const [, dispatchRtcAction] = useAtom(rtcActionsAtom)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  
  // 时间间隔阈值（30秒）
  const TIME_THRESHOLD = 30 * 1000

  // 判断是否需要显示时间戳
  const shouldShowTimestamp = (currentMessage: ChatMessage, previousMessage?: ChatMessage) => {
    if (!previousMessage) return true // 第一条消息总是显示时间
    return currentMessage.timestamp - previousMessage.timestamp > TIME_THRESHOLD
  }

  // 自动滚动到底部
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleClearHistory = () => {
    if (confirm('确定要清除所有聊天记录吗？此操作不可撤销。')) {
      dispatchRtcAction({ type: 'CLEAR_CHAT_HISTORY' })
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageCircle className="h-4 w-4" />
              聊天记录
            </CardTitle>
            <CardDescription className="text-sm" suppressHydrationWarning>
              实时对话记录 ({messages.length} 条消息)
            </CardDescription>
          </div>

            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleClearHistory}
              className="text-gray-500 hover:text-red-500 p-1 h-auto"
              title="清除聊天记录"
              disabled={messages.length === 0}
            >
              🗑️
            </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <div 
          ref={scrollAreaRef}
          className="h-full px-4 pb-4 overflow-y-auto bg-gray-50"
        >
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
              暂无对话记录
            </div>
          ) : (
            <div className="py-2" suppressHydrationWarning>
              {messages.map((message, index) => (
                <React.Fragment key={message.id}>
                  {shouldShowTimestamp(message, messages[index - 1]) && (
                    <TimeStamp timestamp={message.timestamp} />
                  )}
                  <ChatMessageItem message={message} />
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

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
    <div className="w-full h-screen flex flex-col p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        
        {/* 左侧：控制面板 */}
        <div className="space-y-4 overflow-y-auto">
          
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
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center justify-between">
                  <span>连接状态:</span>
                  <span className={`font-medium ${rtcState.isConnected ? "text-green-600" : "text-gray-500"}`}>
                    {rtcState.isConnected ? "已连接" : "未连接"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span>本地音频:</span>
                  <span
                    className={`font-medium ${rtcState.isLocalAudioEnabled ? "text-green-600" : "text-gray-500"}`}
                  >
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
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="welcomeMessage">欢迎消息</Label>
                <Textarea
                  id="welcomeMessage"
                  value={aiConfig.welcomeMessage}
                  onChange={handleAiConfigChange("welcomeMessage")}
                  rows={2}
                />
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

          {/* 远端用户列表 */}
          {rtcState.remoteUsers.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">在线用户</CardTitle>
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

        {/* 右侧：聊天记录 */}
        <div className="min-h-0">
          <ChatHistory messages={voiceChatState.chatHistory} />
        </div>
      </div>
    </div>
  )
}
