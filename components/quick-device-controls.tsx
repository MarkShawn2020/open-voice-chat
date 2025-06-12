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
  const { curMicState } = useMicStore()
  const { toggleMic } = useMicActions()
  
  // 初始化麦克风
  useInitMics()
  
  // 使用mic store的状态，如果没有传入isMicEnabled的话
  const actualMicEnabled = isMicEnabled !== undefined ? isMicEnabled : curMicState.isOn
  const [selectedDevices, setSelectedDevices] = useState({
    microphone: "默认麦克风",
    speaker: "默认扬声器", 
    camera: "默认摄像头"
  })
  
  const [deviceCounts, setDeviceCounts] = useState({
    microphones: 0,
    speakers: 0,
    cameras: 0
  })

  // 获取设备数量
  useEffect(() => {
    const getDeviceCounts = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        setDeviceCounts({
          microphones: devices.filter(d => d.kind === 'audioinput').length,
          speakers: devices.filter(d => d.kind === 'audiooutput').length,
          cameras: devices.filter(d => d.kind === 'videoinput').length
        })
      } catch (error) {
        console.error('Failed to get device counts:', error)
      }
    }
    
    getDeviceCounts()
  }, [])

  const handleDeviceChange = (device: { type: 'microphone' | 'speaker' | 'camera', deviceId: string }) => {
    // 这里可以获取设备名称并更新状态
    onDeviceChange?.(device)
  }

  return (
    <div className={`flex items-center justify-center gap-2 p-3 bg-white/95 backdrop-blur-sm border-t shadow-lg ${className}`}>
      {/* 麦克风控制 */}
      <div className="flex items-center">
        <Button
          variant={actualMicEnabled ? "default" : "destructive"}
          size="sm"
          onClick={() => {
            // 优先使用传入的回调，否则使用mic store的toggle
            if (onMicToggle) {
              onMicToggle()
            } else {
              toggleMic()
            }
          }}
          className="relative group"
          disabled={!curMicState.isPermissionGranted}
        >
          {actualMicEnabled ? (
            <Mic className="h-4 w-4" />
          ) : (
            <MicOff className="h-4 w-4" />
          )}
          {deviceCounts.microphones > 1 && (
            <ChevronUp className="h-3 w-3 ml-1 opacity-60" />
          )}
        </Button>
        
        {/* 麦克风选择提示 */}
        {deviceCounts.microphones > 1 && (
          <div className="text-xs text-gray-500 ml-1 hidden sm:block">
            {deviceCounts.microphones}个
          </div>
        )}
      </div>

      {/* 扬声器控制 */}
      <div className="flex items-center">
        <Button
          variant={isSpeakerEnabled ? "default" : "secondary"}
          size="sm"
          onClick={onSpeakerToggle}
          className="relative group"
        >
          {isSpeakerEnabled ? (
            <Volume2 className="h-4 w-4" />
          ) : (
            <VolumeX className="h-4 w-4" />
          )}
          {deviceCounts.speakers > 1 && (
            <ChevronUp className="h-3 w-3 ml-1 opacity-60" />
          )}
        </Button>
        
        {/* 扬声器选择提示 */}
        {deviceCounts.speakers > 1 && (
          <div className="text-xs text-gray-500 ml-1 hidden sm:block">
            {deviceCounts.speakers}个
          </div>
        )}
      </div>

      {/* 摄像头控制 */}
      <div className="flex items-center">
        <Button
          variant={isCameraEnabled ? "default" : "secondary"}
          size="sm"
          onClick={onCameraToggle}
          className="relative group"
        >
          {isCameraEnabled ? (
            <Camera className="h-4 w-4" />
          ) : (
            <CameraOff className="h-4 w-4" />
          )}
          {deviceCounts.cameras > 1 && (
            <ChevronUp className="h-3 w-3 ml-1 opacity-60" />
          )}
        </Button>
        
        {/* 摄像头选择提示 */}
        {deviceCounts.cameras > 1 && (
          <div className="text-xs text-gray-500 ml-1 hidden sm:block">
            {deviceCounts.cameras}个
          </div>
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