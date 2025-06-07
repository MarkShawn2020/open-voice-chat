// 聊天记录组件
import { ChatMessageItem } from "@/components/chat/chat-message-item"
import { TimeStamp } from "@/components/chat/chat-timestamp"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"


import { rtcActionsAtom } from "@/store/rtc-actions"
import { ChatMessage } from "@/store/voice-chat-state"
import { currentMessagesAtom } from "@/store/voice-chat-state"
import { useAtom } from "jotai/index"
import { MessageCircle } from "lucide-react"
import React, { useEffect, useRef, useState } from "react"

export const ChatHistory = () => {
  const [, dispatchRtcAction] = useAtom(rtcActionsAtom)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const [messages] = useAtom(currentMessagesAtom)

  // 时间间隔阈值（30秒）
  const TIME_THRESHOLD = 30 * 1000

  // 判断是否需要显示时间戳
  const shouldShowTimestamp = (currentMessage: ChatMessage, previousMessage?: ChatMessage) => {
    if (!previousMessage) return true // 第一条消息总是显示时间
    return currentMessage.timestamp - previousMessage.timestamp > TIME_THRESHOLD
  }

  // 处理hydration
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // 自动滚动到底部
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleClearHistory = () => {
    if (confirm("确定要清除所有聊天记录吗？此操作不可撤销。")) {
      dispatchRtcAction({ type: "CLEAR_CHAT_HISTORY" })
    }
  }

  // 只在hydration完成后显示实际的消息
  const displayMessages = isHydrated ? messages : []

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageCircle className="h-4 w-4" />
              聊天记录
            </CardTitle>
            <CardDescription className="text-sm">实时对话记录 ({displayMessages.length} 条消息)</CardDescription>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearHistory}
            className="h-auto p-1 text-gray-500 hover:text-red-500"
            title="清除聊天记录"
            disabled={displayMessages.length === 0}
          >
            🗑️
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <div ref={scrollAreaRef} className="h-full overflow-y-auto bg-gray-50 px-4 pb-4">
          {displayMessages.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-gray-500">暂无对话记录</div>
          ) : (
            <div className="py-2">
              {displayMessages.map((message, index) => (
                <React.Fragment key={message.id}>
                  {shouldShowTimestamp(message, displayMessages[index - 1]) && (
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