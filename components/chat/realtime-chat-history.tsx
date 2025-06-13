"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { currentRealtimeMessagesAtom, realtimeVoiceActionsAtom, realtimeVoiceStateAtom, type RealtimeVoiceMessage } from "@/store/realtime-voice-state"
import { useAtom } from "jotai"
import { Bot, MessageSquare, Pause, Play, Trash2, User, Volume2 } from "lucide-react"
import React, { useRef, useState } from "react"

interface MessageItemProps {
  message: RealtimeVoiceMessage
  onPlayAudio?: (audioUrl: string) => void
  onDeleteMessage?: (messageId: string) => void
}

const MessageItem: React.FC<MessageItemProps> = ({ message, onPlayAudio, onDeleteMessage }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const handlePlayAudio = () => {
    if (!message.audioUrl) return

    if (isPlaying) {
      audioRef.current?.pause()
      setIsPlaying(false)
    } else {
      if (audioRef.current) {
        audioRef.current.play()
        setIsPlaying(true)
      } else if (onPlayAudio) {
        onPlayAudio(message.audioUrl)
      }
    }
  }

  const handleAudioEnded = () => {
    setIsPlaying(false)
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const isUser = message.role === "user"

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* 头像 */}
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
        isUser ? "bg-blue-500" : "bg-green-500"
      }`}>
        {isUser ? (
          <User className="h-4 w-4 text-white" />
        ) : (
          <Bot className="h-4 w-4 text-white" />
        )}
      </div>

      {/* 消息内容 */}
      <div className={`max-w-[80%] space-y-2 ${isUser ? "text-right" : "text-left"}`}>
        {/* 消息气泡 */}
        <div className={`rounded-lg px-3 py-2 ${
          isUser 
            ? "bg-blue-500 text-white" 
            : "bg-gray-100 text-gray-900"
        }`}>
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          
          {/* 音频播放控制 */}
          {message.audioUrl && (
            <div className="mt-2 flex items-center gap-2">
              <Button
                size="sm"
                variant={isUser ? "secondary" : "outline"}
                onClick={handlePlayAudio}
                className="h-6 text-xs"
              >
                {isPlaying ? (
                  <Pause className="mr-1 h-3 w-3" />
                ) : (
                  <Play className="mr-1 h-3 w-3" />
                )}
                {isPlaying ? "暂停" : "播放"}
              </Button>
              <Volume2 className="h-3 w-3 opacity-60" />
              
              {/* 隐藏的音频元素 */}
              <audio
                ref={audioRef}
                src={message.audioUrl}
                onEnded={handleAudioEnded}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* 消息元信息 */}
        <div className={`flex items-center gap-2 text-xs text-gray-500 ${
          isUser ? "justify-end" : "justify-start"
        }`}>
          <span>{formatTime(message.timestamp)}</span>
          {message.isInterim && (
            <span className="rounded bg-yellow-100 px-1 py-0.5 text-yellow-700">
              临时
            </span>
          )}
          
          {/* 删除按钮 */}
          {onDeleteMessage && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDeleteMessage(message.id)}
              className="h-4 w-4 p-0 opacity-60 hover:opacity-100"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export const RealtimeChatHistory: React.FC = () => {
  const [realtimeState] = useAtom(realtimeVoiceStateAtom)
  const [messages] = useAtom(currentRealtimeMessagesAtom)
  const [, dispatchAction] = useAtom(realtimeVoiceActionsAtom)

  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // 自动滚动到底部
  React.useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handlePlayAudio = (audioUrl: string) => {
    dispatchAction({ type: "PLAY_AUDIO", audioUrl })
  }

  const handleDeleteMessage = (messageId: string) => {
    // 这里可以添加删除消息的逻辑
    console.log("删除消息:", messageId)
  }

  const handleClearMessages = () => {
    dispatchAction({ type: "CLEAR_MESSAGES" })
  }

  const handleClearError = () => {
    dispatchAction({ type: "CLEAR_ERROR" })
  }

  if (!realtimeState.isConnected) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            端到端语音聊天
          </CardTitle>
          <CardDescription>
            请先连接到端到端语音服务
          </CardDescription>
        </CardHeader>
        <CardContent className="flex h-full items-center justify-center">
          <div className="text-center text-gray-500">
            <MessageSquare className="mx-auto h-12 w-12 opacity-50" />
            <p className="mt-2">等待连接...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              端到端语音聊天
            </CardTitle>
            <CardDescription>
              {realtimeState.sessionId ? `会话ID: ${realtimeState.sessionId.slice(0, 8)}...` : "未开始会话"}
            </CardDescription>
          </div>
          
          {messages.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleClearMessages}
            >
              <Trash2 className="mr-1 h-3 w-3" />
              清空
            </Button>
          )}
        </div>

        {/* 错误提示 */}
        {realtimeState.error && (
          <div className="rounded-md bg-red-50 p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-700">{realtimeState.error}</p>
              <Button size="sm" variant="ghost" onClick={handleClearError}>
                ✕
              </Button>
            </div>
          </div>
        )}

        {/* 状态指示 */}
        <div className="flex gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <div className={`h-2 w-2 rounded-full ${
              realtimeState.isSessionActive ? "bg-green-500" : "bg-gray-400"
            }`} />
            <span>会话: {realtimeState.isSessionActive ? "进行中" : "未开始"}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <div className={`h-2 w-2 rounded-full ${
              realtimeState.isRecording ? "bg-red-500 animate-pulse" : "bg-gray-400"
            }`} />
            <span>录音: {realtimeState.isRecording ? "进行中" : "已停止"}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <div className={`h-2 w-2 rounded-full ${
              realtimeState.isSpeaking ? "bg-blue-500 animate-pulse" : 
              realtimeState.isThinking ? "bg-yellow-500 animate-pulse" : "bg-gray-400"
            }`} />
            <span>AI: {
              realtimeState.isSpeaking ? "说话中" : 
              realtimeState.isThinking ? "思考中" : "空闲"
            }</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 min-h-0 p-0">
        <ScrollArea className="h-full px-4 pb-4" ref={scrollAreaRef}>
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center text-gray-500">
                <MessageSquare className="mx-auto h-12 w-12 opacity-50" />
                <p className="mt-2">
                  {realtimeState.isSessionActive 
                    ? "开始对话吧！点击录音按钮开始..." 
                    : "请先开始会话"}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  onPlayAudio={handlePlayAudio}
                  onDeleteMessage={handleDeleteMessage}
                />
              ))}
              
              {/* 实时显示区域 */}
              {(realtimeState.userTranscript || realtimeState.assistantText) && (
                <div className="border-t pt-4 space-y-2">
                  {realtimeState.userTranscript && (
                    <div className="flex gap-3 flex-row-reverse">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div className="max-w-[80%] text-right">
                        <div className="rounded-lg bg-blue-100 px-3 py-2 border-2 border-blue-200">
                          <p className="text-sm text-blue-800">{realtimeState.userTranscript}</p>
                        </div>
                        <div className="mt-1 text-xs text-gray-500">实时识别中...</div>
                      </div>
                    </div>
                  )}
                  
                  {realtimeState.assistantText && (
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <div className="max-w-[80%]">
                        <div className="rounded-lg bg-green-100 px-3 py-2 border-2 border-green-200">
                          <p className="text-sm text-green-800">{realtimeState.assistantText}</p>
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {realtimeState.isThinking ? "思考中..." : realtimeState.isSpeaking ? "播放中..." : "生成中..."}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}