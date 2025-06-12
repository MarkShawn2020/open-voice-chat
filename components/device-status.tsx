"use client"

import { Badge } from "@/components/ui/badge"
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Camera, 
  CameraOff,
  Headphones,
  Speaker
} from "lucide-react"
import React from "react"

interface DeviceStatusProps {
  isMicEnabled?: boolean
  isSpeakerEnabled?: boolean
  isCameraEnabled?: boolean
  microphoneName?: string
  speakerName?: string
  cameraName?: string
  className?: string
}

export const DeviceStatus: React.FC<DeviceStatusProps> = ({
  isMicEnabled = false,
  isSpeakerEnabled = true,
  isCameraEnabled = false,
  microphoneName = "默认麦克风",
  speakerName = "默认扬声器",
  cameraName = "默认摄像头",
  className = ""
}) => {
  const truncateDeviceName = (name: string, maxLength: number = 12) => {
    if (name.length <= maxLength) return name
    return name.substring(0, maxLength) + "..."
  }

  return (
    <div className={`flex items-center gap-3 text-sm ${className}`}>
      {/* 麦克风状态 */}
      <div className="flex items-center gap-1.5">
        {isMicEnabled ? (
          <Mic className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <MicOff className="h-3.5 w-3.5 text-red-500" />
        )}
        <Badge 
          variant={isMicEnabled ? "default" : "secondary"} 
          className="text-xs px-2 py-0.5 h-5"
          title={microphoneName}
        >
          {truncateDeviceName(microphoneName)}
        </Badge>
      </div>

      {/* 扬声器状态 */}
      <div className="flex items-center gap-1.5">
        {isSpeakerEnabled ? (
          <Volume2 className="h-3.5 w-3.5 text-blue-500" />
        ) : (
          <VolumeX className="h-3.5 w-3.5 text-gray-400" />
        )}
        <Badge 
          variant={isSpeakerEnabled ? "default" : "secondary"} 
          className="text-xs px-2 py-0.5 h-5"
          title={speakerName}
        >
          {truncateDeviceName(speakerName)}
        </Badge>
      </div>

      {/* 摄像头状态 */}
      <div className="flex items-center gap-1.5">
        {isCameraEnabled ? (
          <Camera className="h-3.5 w-3.5 text-purple-500" />
        ) : (
          <CameraOff className="h-3.5 w-3.5 text-gray-400" />
        )}
        <Badge 
          variant={isCameraEnabled ? "default" : "secondary"} 
          className="text-xs px-2 py-0.5 h-5"
          title={cameraName}
        >
          {truncateDeviceName(cameraName)}
        </Badge>
      </div>
    </div>
  )
}