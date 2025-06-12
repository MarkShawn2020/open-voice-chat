"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { useInitMics, useMicActions, useMicStore } from "@/store/mic"
import {
  Camera,
  CameraOff,
  ChevronUp,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Users
} from "lucide-react"
import React, { useEffect, useState } from "react"

interface QuickDeviceControlsProps {
  isMicEnabled?: boolean
  isSpeakerEnabled?: boolean
  isCameraEnabled?: boolean
  isPersonDetectionEnabled?: boolean
  onMicToggle?: () => void
  onSpeakerToggle?: () => void
  onCameraToggle?: () => void
  onPersonDetectionToggle?: () => void
  onDeviceChange?: (device: { type: 'microphone' | 'speaker' | 'camera', deviceId: string }) => void
  className?: string
}

export const QuickDeviceControls: React.FC<QuickDeviceControlsProps> = ({
  isMicEnabled,
  isSpeakerEnabled = true,
  isCameraEnabled = false,
  isPersonDetectionEnabled = false,
  onMicToggle,
  onSpeakerToggle,
  onCameraToggle,
  onPersonDetectionToggle,
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
        // 先请求权限以获取设备标签
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true
          })
          // 获取权限后立即关闭流
          stream.getTracks().forEach(track => track.stop())
        } catch (permissionError) {
          console.log('Permission not granted, will get limited device info')
        }

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
          setSelectedSpeaker(speakers[0]?.deviceId || '')
        }
        if (cameras.length > 0 && !selectedCamera) {
          setSelectedCamera(cameras[0]?.deviceId || '')
        }
      } catch (error) {
        console.error('Failed to get devices:', error)
      }
    }

    getDevices()
  }, [mics, selectedSpeaker, selectedCamera])


  return (
    <div className={`flex items-center justify-center gap-2 p-3 bg-white/95 backdrop-blur-sm border-t shadow-lg ${className}`}>
      {/* 麦克风控制 */}
      <div className="flex items-center">
        <DropdownMenu>
          <div className="flex">
            {/* 主麦克风按钮 */}
            <Button
              variant={actualMicEnabled ? "default" : "destructive"}
              size="sm"
              onClick={() => {
                console.log('Mic button clicked', { onMicToggle, toggleMic })
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
      </div>

      {/* 扬声器控制 */}
      <div className="flex items-center">
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
      </div>

      {/* 摄像头控制 */}
      <div className="flex items-center">
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
      </div>

      {/* 人员检测控制 */}
      <div className="flex items-center">
        <Button
          variant={isPersonDetectionEnabled ? "default" : "secondary"}
          size="sm"
          onClick={onPersonDetectionToggle}
          disabled={!isCameraEnabled}
          className="flex items-center gap-1"
          title={!isCameraEnabled ? "请先启用摄像头" : isPersonDetectionEnabled ? "关闭人员检测" : "开启人员检测"}
        >
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline text-xs">
            {isPersonDetectionEnabled ? "检测中" : "人员检测"}
          </span>
        </Button>
      </div>
    </div>
  )
}