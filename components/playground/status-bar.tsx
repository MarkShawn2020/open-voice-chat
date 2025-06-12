"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { rtcStateAtom } from "@/store/rtc-state"
import { voiceChatStateAtom } from "@/store/voice-chat-state"
import { useAtom } from "jotai"
import {
  AlertCircle,
  Bot,
  BotOff,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react"

interface StatusBarProps {
  title?: string
  children?: React.ReactNode
}

export const StatusBar: React.FC<StatusBarProps> = ({ 
  title = "语音对话测试台",
  children 
}) => {
  const [rtcState] = useAtom(rtcStateAtom)
  const [voiceChatState] = useAtom(voiceChatStateAtom)

  return (
    <div className="border-b bg-white/90 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                {rtcState.isConnected ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-gray-400" />
                )}
                <span className={rtcState.isConnected ? "text-green-600" : "text-gray-500"}>
                  {rtcState.isConnected ? "已连接" : "未连接"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {voiceChatState.isAgentActive ? (
                  <Bot className="h-4 w-4 text-green-500" />
                ) : (
                  <BotOff className="h-4 w-4 text-gray-400" />
                )}
                <span className={voiceChatState.isAgentActive ? "text-green-600" : "text-gray-500"}>
                  AI: {voiceChatState.isAgentActive ? "运行" : "停止"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-blue-600">{rtcState.remoteUsers.length} 用户在线</span>
              </div>
            </div>
          </div>

          {children}
        </div>

        {(rtcState.error || voiceChatState.error) && (
          <Alert variant="destructive" className="mt-3">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">{rtcState.error || voiceChatState.error}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}