// 聊天消息组件
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { ChatMessage, rtcActionsAtom } from "@/store/rtc"
import { useAtom } from "jotai/index"
import { Trash2 } from "lucide-react"
import React from "react"

export const ChatMessageItem: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const [, dispatchRtcAction] = useAtom(rtcActionsAtom)
  const isUser = message.role === "user"

  const handleDeleteMessage = () => {
    dispatchRtcAction({ type: "DELETE_CHAT_MESSAGE", messageId: message.id })
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-2`}>
          <div
            className={`relative max-w-[75%] cursor-pointer rounded-2xl px-3 py-2 select-text ${
              isUser
                ? `bg-blue-500 text-white ${!message.isComplete ? "opacity-70" : ""}`
                : `border bg-white text-gray-900 ${!message.isComplete ? "opacity-70" : ""}`
            }`}
          >
            <div className="text-sm leading-relaxed break-words">{message.content}</div>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={handleDeleteMessage} variant="destructive" className="cursor-pointer">
          <Trash2 className="mr-2 h-4 w-4" />
          删除消息
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}