"use client"

import { Button } from "@/components/ui/button"
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Camera, 
  CameraOff,
  Settings,
  ChevronUp
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import React, { useState, useEffect } from "react"
import { DeviceSelector } from "./device-selector"
import { useMicStore, useMicActions, useInitMics } from "@/store/mic"

interface QuickDeviceControlsProps {
  isMicEnabled?: boolean
  isSpeakerEnabled?: boolean
  isCameraEnabled?: boolean
  onMicToggle?: () => void
  onSpeakerToggle?: () => void
  onCameraToggle?: () => void
  onDeviceChange?: (device: { type: 'microphone' | 'speaker' | 'camera', deviceId: string }) => void
  className?: string
}

export const QuickDeviceControls: React.FC<QuickDeviceControlsProps> = ({
  isMicEnabled,
  isSpeakerEnabled = true,
  isCameraEnabled = false,
  onMicToggle,
  onSpeakerToggle,
  onCameraToggle,
  onDeviceChange,
  className = ""
}) => {
  // 使用mic store来获取真实的麦克风状态
  const { curMicState, mics, curMicId } = useMicStore()
  const { toggleMic, changeMic } = useMicActions()
  
  // 初始化麦克风
  useInitMics()
  
  // 使用mic store的状态，如果没有传入isMicEnabled的话
  const actualMicEnabled = isMicEnabled !== undefined ? isMicEnabled : curMicState.isOn
  
  const [deviceCounts, setDeviceCounts] = useState({
    microphones: 0,
    speakers: 0,
    cameras: 0
  })
  
  const [speakerDevices, setSpeakerDevices] = useState<MediaDeviceInfo[]>([])
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>("")
  const [selectedCamera, setSelectedCamera] = useState<string>("")

  // 获取设备列表
  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const speakers = devices.filter(d => d.kind === 'audiooutput')
        const cameras = devices.filter(d => d.kind === 'videoinput')
        
        setSpeakerDevices(speakers)
        setCameraDevices(cameras)
        
        setDeviceCounts({
          microphones: mics.length,
          speakers: speakers.length,
          cameras: cameras.length
        })
        
        // 设置默认选择
        if (speakers.length > 0 && !selectedSpeaker) {
          setSelectedSpeaker(speakers[0].deviceId)
        }
        if (cameras.length > 0 && !selectedCamera) {
          setSelectedCamera(cameras[0].deviceId)
        }
      } catch (error) {
        console.error('Failed to get devices:', error)
      }
    }
    
    getDevices()
  }, [mics, selectedSpeaker, selectedCamera])

  const handleDeviceChange = (device: { type: 'microphone' | 'speaker' | 'camera', deviceId: string }) => {
    // 这里可以获取设备名称并更新状态
    onDeviceChange?.(device)
  }

  return (
    <div className={`flex items-center justify-center gap-2 p-3 bg-white/95 backdrop-blur-sm border-t shadow-lg ${className}`}>
      {/* 麦克风控制 */}
      <div className="flex items-center">
        {deviceCounts.microphones > 1 ? (
          <DropdownMenu>
            <div className="flex">
              {/* 主麦克风按钮 */}
              <Button
                variant={actualMicEnabled ? "default" : "destructive"}
                size="sm"
                onClick={() => {
                  if (onMicToggle) {
                    onMicToggle()
                  } else {
                    toggleMic()
                  }
                }}
                className="rounded-r-none border-r-0"
                disabled={!curMicState.isPermissionGranted}
              >
                {actualMicEnabled ? (
                  <Mic className="h-4 w-4" />
                ) : (
                  <MicOff className="h-4 w-4" />
                )}
              </Button>
              
              {/* 设备选择按钮 */}
              <DropdownMenuTrigger asChild>
                <Button
                  variant={actualMicEnabled ? "default" : "destructive"}
                  size="sm"
                  className="rounded-l-none px-2"
                  disabled={!curMicState.isPermissionGranted}
                >
                  <ChevronUp className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
            </div>
            
            <DropdownMenuContent align="center" className="w-64">
              <DropdownMenuLabel>选择麦克风</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {mics.map((mic, index) => (
                <DropdownMenuItem
                  key={mic.deviceId || `mic-${index}`}
                  onClick={() => {
                    const deviceId = mic.deviceId || `mic-${index}`
                    changeMic(deviceId)
                    onDeviceChange?.({ type: 'microphone', deviceId })
                  }}
                  className={curMicId === mic.deviceId ? "bg-blue-50" : ""}
                >
                  <div className="flex items-center gap-2">
                    <Mic className="h-4 w-4" />
                    <span className="truncate">
                      {mic.label || `麦克风 ${index + 1}`}
                    </span>
                    {curMicId === mic.deviceId && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          /* 单设备时的简单按钮 */
          <Button
            variant={actualMicEnabled ? "default" : "destructive"}
            size="sm"
            onClick={() => {
              if (onMicToggle) {
                onMicToggle()
              } else {
                toggleMic()
              }
            }}
            disabled={!curMicState.isPermissionGranted}
          >
            {actualMicEnabled ? (
              <Mic className="h-4 w-4" />
            ) : (
              <MicOff className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* 扬声器控制 */}
      <div className="flex items-center">
        {deviceCounts.speakers > 1 ? (
          <DropdownMenu>
            <div className="flex">
              {/* 主扬声器按钮 */}
              <Button
                variant={isSpeakerEnabled ? "default" : "secondary"}
                size="sm"
                onClick={onSpeakerToggle}
                className="rounded-r-none border-r-0"
              >
                {isSpeakerEnabled ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
              </Button>
              
              {/* 设备选择按钮 */}
              <DropdownMenuTrigger asChild>
                <Button
                  variant={isSpeakerEnabled ? "default" : "secondary"}
                  size="sm"
                  className="rounded-l-none px-2"
                >
                  <ChevronUp className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
            </div>
            
            <DropdownMenuContent align="center" className="w-64">
              <DropdownMenuLabel>选择扬声器</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {speakerDevices.map((speaker, index) => (
                <DropdownMenuItem
                  key={speaker.deviceId || `speaker-${index}`}
                  onClick={() => {
                    const deviceId = speaker.deviceId || `speaker-${index}`
                    setSelectedSpeaker(deviceId)
                    onDeviceChange?.({ type: 'speaker', deviceId })
                  }}
                  className={selectedSpeaker === speaker.deviceId ? "bg-blue-50" : ""}
                >
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    <span className="truncate">
                      {speaker.label || `扬声器 ${index + 1}`}
                    </span>
                    {selectedSpeaker === speaker.deviceId && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          /* 单设备时的简单按钮 */
          <Button
            variant={isSpeakerEnabled ? "default" : "secondary"}
            size="sm"
            onClick={onSpeakerToggle}
          >
            {isSpeakerEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* 摄像头控制 */}
      <div className="flex items-center">
        {deviceCounts.cameras > 1 ? (
          <DropdownMenu>
            <div className="flex">
              {/* 主摄像头按钮 */}
              <Button
                variant={isCameraEnabled ? "default" : "secondary"}
                size="sm"
                onClick={onCameraToggle}
                className="rounded-r-none border-r-0"
              >
                {isCameraEnabled ? (
                  <Camera className="h-4 w-4" />
                ) : (
                  <CameraOff className="h-4 w-4" />
                )}
              </Button>
              
              {/* 设备选择按钮 */}
              <DropdownMenuTrigger asChild>
                <Button
                  variant={isCameraEnabled ? "default" : "secondary"}
                  size="sm"
                  className="rounded-l-none px-2"
                >
                  <ChevronUp className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
            </div>
            
            <DropdownMenuContent align="center" className="w-64">
              <DropdownMenuLabel>选择摄像头</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {cameraDevices.map((camera, index) => (
                <DropdownMenuItem
                  key={camera.deviceId || `camera-${index}`}
                  onClick={() => {
                    const deviceId = camera.deviceId || `camera-${index}`
                    setSelectedCamera(deviceId)
                    onDeviceChange?.({ type: 'camera', deviceId })
                  }}
                  className={selectedCamera === camera.deviceId ? "bg-blue-50" : ""}
                >
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    <span className="truncate">
                      {camera.label || `摄像头 ${index + 1}`}
                    </span>
                    {selectedCamera === camera.deviceId && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          /* 单设备时的简单按钮 */
          <Button
            variant={isCameraEnabled ? "default" : "secondary"}
            size="sm"
            onClick={onCameraToggle}
          >
            {isCameraEnabled ? (
              <Camera className="h-4 w-4" />
            ) : (
              <CameraOff className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* 分隔线 */}
      <div className="h-6 w-px bg-gray-300 mx-2" />

      {/* 设备设置 */}
      <DeviceSelector 
        onDeviceChange={handleDeviceChange}
        trigger={
          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline ml-2">设备</span>
          </Button>
        }
      />

      {/* 设备状态指示 */}
      <div className="hidden lg:flex items-center gap-3 ml-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${actualMicEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>麦克风</span>
        </div>
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${isSpeakerEnabled ? 'bg-blue-500' : 'bg-gray-400'}`} />
          <span>扬声器</span>
        </div>
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${isCameraEnabled ? 'bg-purple-500' : 'bg-gray-400'}`} />
          <span>摄像头</span>
        </div>
      </div>
    </div>
  )
}