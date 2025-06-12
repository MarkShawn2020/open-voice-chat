"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Camera, 
  CameraOff, 
  Settings,
  TestTube,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from "lucide-react"
import React, { useEffect, useState } from "react"

interface MediaDevice {
  deviceId: string
  label: string
  kind: MediaDeviceKind
  groupId: string
}

interface DeviceState {
  microphones: MediaDevice[]
  speakers: MediaDevice[]
  cameras: MediaDevice[]
  selectedMicrophone: string
  selectedSpeaker: string
  selectedCamera: string
  microphoneVolume: number
  speakerVolume: number
  isMicMuted: boolean
  isSpeakerMuted: boolean
  isCameraOn: boolean
}

interface DeviceTestState {
  microphone: 'idle' | 'testing' | 'success' | 'error'
  speaker: 'idle' | 'testing' | 'success' | 'error'
  camera: 'idle' | 'testing' | 'success' | 'error'
}

interface DeviceSelectorProps {
  trigger?: React.ReactNode
  onDeviceChange?: (device: { type: 'microphone' | 'speaker' | 'camera', deviceId: string }) => void
  className?: string
}

export const DeviceSelector: React.FC<DeviceSelectorProps> = ({
  trigger,
  onDeviceChange,
  className
}) => {
  const [open, setOpen] = useState(false)
  const [deviceState, setDeviceState] = useState<DeviceState>({
    microphones: [],
    speakers: [],
    cameras: [],
    selectedMicrophone: '',
    selectedSpeaker: '',
    selectedCamera: '',
    microphoneVolume: 80,
    speakerVolume: 80,
    isMicMuted: false,
    isSpeakerMuted: false,
    isCameraOn: false
  })
  const [testState, setTestState] = useState<DeviceTestState>({
    microphone: 'idle',
    speaker: 'idle',
    camera: 'idle'
  })
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [micLevel, setMicLevel] = useState(0)

  // 获取设备列表
  const enumerateDevices = async () => {
    try {
      // 请求权限
      await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      
      const devices = await navigator.mediaDevices.enumerateDevices()
      
      const microphones = devices.filter(device => device.kind === 'audioinput')
      const speakers = devices.filter(device => device.kind === 'audiooutput')
      const cameras = devices.filter(device => device.kind === 'videoinput')
      
      setDeviceState(prev => ({
        ...prev,
        microphones: microphones.map(d => ({
          deviceId: d.deviceId,
          label: d.label || `麦克风 ${microphones.indexOf(d) + 1}`,
          kind: d.kind,
          groupId: d.groupId
        })),
        speakers: speakers.map(d => ({
          deviceId: d.deviceId,
          label: d.label || `扬声器 ${speakers.indexOf(d) + 1}`,
          kind: d.kind,
          groupId: d.groupId
        })),
        cameras: cameras.map(d => ({
          deviceId: d.deviceId,
          label: d.label || `摄像头 ${cameras.indexOf(d) + 1}`,
          kind: d.kind,
          groupId: d.groupId
        })),
        selectedMicrophone: prev.selectedMicrophone || microphones[0]?.deviceId || '',
        selectedSpeaker: prev.selectedSpeaker || speakers[0]?.deviceId || '',
        selectedCamera: prev.selectedCamera || cameras[0]?.deviceId || ''
      }))
    } catch (error) {
      console.error('Failed to enumerate devices:', error)
    }
  }

  // 测试麦克风
  const testMicrophone = async () => {
    setTestState(prev => ({ ...prev, microphone: 'testing' }))
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: deviceState.selectedMicrophone }
      })
      
      const audioCtx = new AudioContext()
      const analyser = audioCtx.createAnalyser()
      const microphone = audioCtx.createMediaStreamSource(stream)
      
      microphone.connect(analyser)
      analyser.fftSize = 256
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      
      let maxLevel = 0
      const checkLevel = () => {
        analyser.getByteFrequencyData(dataArray)
        const level = Math.max(...dataArray)
        maxLevel = Math.max(maxLevel, level)
        setMicLevel(level)
      }
      
      const interval = setInterval(checkLevel, 100)
      
      setTimeout(() => {
        clearInterval(interval)
        stream.getTracks().forEach(track => track.stop())
        audioCtx.close()
        
        if (maxLevel > 30) {
          setTestState(prev => ({ ...prev, microphone: 'success' }))
        } else {
          setTestState(prev => ({ ...prev, microphone: 'error' }))
        }
        
        setTimeout(() => {
          setTestState(prev => ({ ...prev, microphone: 'idle' }))
          setMicLevel(0)
        }, 2000)
      }, 3000)
      
    } catch (error) {
      console.error('Microphone test failed:', error)
      setTestState(prev => ({ ...prev, microphone: 'error' }))
      setTimeout(() => {
        setTestState(prev => ({ ...prev, microphone: 'idle' }))
      }, 2000)
    }
  }

  // 测试扬声器
  const testSpeaker = async () => {
    setTestState(prev => ({ ...prev, speaker: 'testing' }))
    
    try {
      // 创建测试音频
      const audioContext = new AudioContext()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime) // A4音符
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      
      oscillator.start()
      oscillator.stop(audioContext.currentTime + 1)
      
      setTimeout(() => {
        setTestState(prev => ({ ...prev, speaker: 'success' }))
        setTimeout(() => {
          setTestState(prev => ({ ...prev, speaker: 'idle' }))
        }, 2000)
      }, 1000)
      
    } catch (error) {
      console.error('Speaker test failed:', error)
      setTestState(prev => ({ ...prev, speaker: 'error' }))
      setTimeout(() => {
        setTestState(prev => ({ ...prev, speaker: 'idle' }))
      }, 2000)
    }
  }

  // 测试摄像头
  const testCamera = async () => {
    setTestState(prev => ({ ...prev, camera: 'testing' }))
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: deviceState.selectedCamera }
      })
      
      setTimeout(() => {
        stream.getTracks().forEach(track => track.stop())
        setTestState(prev => ({ ...prev, camera: 'success' }))
        setTimeout(() => {
          setTestState(prev => ({ ...prev, camera: 'idle' }))
        }, 2000)
      }, 2000)
      
    } catch (error) {
      console.error('Camera test failed:', error)
      setTestState(prev => ({ ...prev, camera: 'error' }))
      setTimeout(() => {
        setTestState(prev => ({ ...prev, camera: 'idle' }))
      }, 2000)
    }
  }

  // 设备选择变化处理
  const handleDeviceChange = (type: 'microphone' | 'speaker' | 'camera', deviceId: string) => {
    setDeviceState(prev => ({
      ...prev,
      [`selected${type.charAt(0).toUpperCase() + type.slice(1)}`]: deviceId
    }))
    onDeviceChange?.({ type, deviceId })
  }

  // 初始化
  useEffect(() => {
    if (open) {
      enumerateDevices()
    }
  }, [open])

  // 监听设备变化
  useEffect(() => {
    const handleDeviceChange = () => {
      enumerateDevices()
    }
    
    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange)
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange)
    }
  }, [])

  const getTestIcon = (status: DeviceTestState[keyof DeviceTestState]) => {
    switch (status) {
      case 'testing':
        return <RefreshCw className="h-3 w-3 animate-spin" />
      case 'success':
        return <CheckCircle className="h-3 w-3 text-green-500" />
      case 'error':
        return <AlertCircle className="h-3 w-3 text-red-500" />
      default:
        return <TestTube className="h-3 w-3" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className={className}>
            <Settings className="h-4 w-4 mr-2" />
            设备设置
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            设备设置
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 max-h-[calc(85vh-120px)] overflow-y-auto pr-2">
          {/* 麦克风设置 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  {deviceState.isMicMuted ? (
                    <MicOff className="h-4 w-4 text-red-500" />
                  ) : (
                    <Mic className="h-4 w-4 text-green-500" />
                  )}
                  麦克风
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={!deviceState.isMicMuted}
                    onCheckedChange={(checked) => 
                      setDeviceState(prev => ({ ...prev, isMicMuted: !checked }))
                    }
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={testMicrophone}
                    disabled={testState.microphone === 'testing'}
                    className="h-7"
                  >
                    {getTestIcon(testState.microphone)}
                    <span className="ml-1 text-xs">测试</span>
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">选择麦克风</label>
                <Select
                  value={deviceState.selectedMicrophone}
                  onValueChange={(value) => handleDeviceChange('microphone', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择麦克风" />
                  </SelectTrigger>
                  <SelectContent>
                    {deviceState.microphones.map((device) => (
                      <SelectItem key={device.deviceId} value={device.deviceId}>
                        {device.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">音量</label>
                  <span className="text-sm text-gray-500">{deviceState.microphoneVolume}%</span>
                </div>
                <Slider
                  value={[deviceState.microphoneVolume]}
                  onValueChange={([value]) => 
                    setDeviceState(prev => ({ ...prev, microphoneVolume: value }))
                  }
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
              
              {/* 麦克风电平显示 */}
              {micLevel > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">输入电平</label>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-100"
                      style={{ width: `${Math.min(micLevel / 255 * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 扬声器设置 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  {deviceState.isSpeakerMuted ? (
                    <VolumeX className="h-4 w-4 text-red-500" />
                  ) : (
                    <Volume2 className="h-4 w-4 text-green-500" />
                  )}
                  扬声器
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={!deviceState.isSpeakerMuted}
                    onCheckedChange={(checked) => 
                      setDeviceState(prev => ({ ...prev, isSpeakerMuted: !checked }))
                    }
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={testSpeaker}
                    disabled={testState.speaker === 'testing'}
                    className="h-7"
                  >
                    {getTestIcon(testState.speaker)}
                    <span className="ml-1 text-xs">测试</span>
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">选择扬声器</label>
                <Select
                  value={deviceState.selectedSpeaker}
                  onValueChange={(value) => handleDeviceChange('speaker', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择扬声器" />
                  </SelectTrigger>
                  <SelectContent>
                    {deviceState.speakers.map((device) => (
                      <SelectItem key={device.deviceId} value={device.deviceId}>
                        {device.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">音量</label>
                  <span className="text-sm text-gray-500">{deviceState.speakerVolume}%</span>
                </div>
                <Slider
                  value={[deviceState.speakerVolume]}
                  onValueChange={([value]) => 
                    setDeviceState(prev => ({ ...prev, speakerVolume: value }))
                  }
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* 摄像头设置 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  {deviceState.isCameraOn ? (
                    <Camera className="h-4 w-4 text-green-500" />
                  ) : (
                    <CameraOff className="h-4 w-4 text-gray-500" />
                  )}
                  摄像头
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={deviceState.isCameraOn}
                    onCheckedChange={(checked) => 
                      setDeviceState(prev => ({ ...prev, isCameraOn: checked }))
                    }
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={testCamera}
                    disabled={testState.camera === 'testing'}
                    className="h-7"
                  >
                    {getTestIcon(testState.camera)}
                    <span className="ml-1 text-xs">测试</span>
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">选择摄像头</label>
                <Select
                  value={deviceState.selectedCamera}
                  onValueChange={(value) => handleDeviceChange('camera', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择摄像头" />
                  </SelectTrigger>
                  <SelectContent>
                    {deviceState.cameras.map((device) => (
                      <SelectItem key={device.deviceId} value={device.deviceId}>
                        {device.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 设备信息 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">设备信息</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="space-y-1">
                  <div className="font-medium">麦克风</div>
                  <Badge variant="outline" className="text-xs">
                    {deviceState.microphones.length} 个设备
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="font-medium">扬声器</div>
                  <Badge variant="outline" className="text-xs">
                    {deviceState.speakers.length} 个设备
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="font-medium">摄像头</div>
                  <Badge variant="outline" className="text-xs">
                    {deviceState.cameras.length} 个设备
                  </Badge>
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={enumerateDevices}
                className="mt-4 w-full"
              >
                <RefreshCw className="h-3 w-3 mr-2" />
                刷新设备列表
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}