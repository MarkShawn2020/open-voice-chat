"use client"

import { Button } from "@/components/ui/button"
import { rtcConfigAtom } from "@/store/rtc-config"
import { rtcStateAtom } from "@/store/rtc-state"
import { voiceChatStateAtom } from "@/store/voice-chat-state"
import { useMicStore } from "@/store/mic"
import { useAtom } from "jotai"
import {
  Bot,
  BotOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
} from "lucide-react"

interface MainControlsProps {
  onJoinRoom: () => void
  onLeaveRoom: () => void
  onToggleAudio: () => void
  onStartVoiceChat: () => void
  onStopVoiceChat: () => void
}

export const MainControls: React.FC<MainControlsProps> = ({
  onJoinRoom,
  onLeaveRoom,
  onToggleAudio,
  onStartVoiceChat,
  onStopVoiceChat,
}) => {
  const [config] = useAtom(rtcConfigAtom)
  const [rtcState] = useAtom(rtcStateAtom)
  const [voiceChatState] = useAtom(voiceChatStateAtom)
  const { curMicState } = useMicStore()

  return (
    <div className="flex items-center gap-2">
      {!rtcState.isConnected ? (
        <Button onClick={onJoinRoom} disabled={!config} size="sm">
          <Phone className="mr-2 h-4 w-4" />
          加入房间
        </Button>
      ) : (
        <>
          <Button
            onClick={onToggleAudio}
            variant={curMicState.isOn ? "default" : "secondary"}
            size="sm"
            disabled={!curMicState.isPermissionGranted}
          >
            {curMicState.isOn ? <Mic className="mr-1 h-3 w-3" /> : <MicOff className="mr-1 h-3 w-3" />}
            麦克风
          </Button>
          {!voiceChatState.isAgentActive ? (
            <Button onClick={onStartVoiceChat} disabled={voiceChatState.isStarting} size="sm">
              <Bot className="mr-2 h-4 w-4" />
              {voiceChatState.isStarting ? "启动中..." : "启动AI"}
            </Button>
          ) : (
            <Button
              onClick={onStopVoiceChat}
              variant="destructive"
              disabled={voiceChatState.isStopping}
              size="sm"
            >
              <BotOff className="mr-2 h-4 w-4" />
              {voiceChatState.isStopping ? "停止中..." : "停止AI"}
            </Button>
          )}
          <Button onClick={onLeaveRoom} variant="outline" size="sm">
            <PhoneOff className="mr-1 h-3 w-3" />
            离开房间
          </Button>
        </>
      )}
    </div>
  )
}