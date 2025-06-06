import { atom } from "jotai"
import { useEffect } from "react"
import { create } from "zustand"

export const isChattingAtom = atom(false)

export interface IMicState {
  isPermissionGranted: boolean
  isOn: boolean
  volume: number
}
export interface IMicrophoneManager {
  mics: MediaDeviceInfo[]
  curMicId: string | null
  curMicState: IMicState
  curMic: () => MediaDeviceInfo | undefined
  initMics: (mics: MediaDeviceInfo[]) => void
  changeMic: (id: string) => void
}

export const useMicsStore = create<IMicrophoneManager>((set, get) => ({
  mics: [],
  curMicId: null,
  curMicState: {
    isPermissionGranted: false,
    isOn: false,
    volume: 0,
  },
  curMic: () => {
    return get().mics.find((mic) => mic.deviceId === get().curMicId)
  },
  initMics: (mics: MediaDeviceInfo[]) => {
    set({ mics })
    if(mics.length > 0) {
      get().changeMic(mics[0]!.deviceId)
    }
  },
  changeMic: (id: string) => {
    set({ curMicId: id })
    
    // 重置状态
    set({ 
      curMicState: { 
        isPermissionGranted: false, 
        isOn: false, 
        volume: 0 
      } 
    })
    
    // 检查麦克风权限并开始监控
    navigator.mediaDevices.getUserMedia({ audio: { deviceId: id } })
      .then((stream) => {
        // 更新权限状态
        set({ 
          curMicState: { 
            ...get().curMicState, 
            isPermissionGranted: true, 
            isOn: true 
          } 
        })
        
        const audio = new AudioContext()
        const source = audio.createMediaStreamSource(stream)
        const processor = audio.createScriptProcessor(4096, 1, 1)
        source.connect(processor)
        processor.connect(audio.destination)
        
        processor.onaudioprocess = (e) => {
          const input = e.inputBuffer.getChannelData(0)
          const sum = input.reduce((a, b) => a + Math.abs(b), 0)
          const volume = Math.min(sum / input.length * 10, 1) // 放大并限制在0-1范围
          console.log({ volume })
          set({ curMicState: { ...get().curMicState, volume } })
        }
        
        // 存储流引用以便后续清理
        // TODO: 在组件卸载或切换麦克风时清理资源
      })
      .catch((err) => {
        console.error('Failed to access microphone:', err)
        set({ 
          curMicState: { 
            ...get().curMicState, 
            isPermissionGranted: false,
            isOn: false 
          } 
        })
      })
  },
}))

export const useInitMics = () => {
  const { initMics } = useMicsStore()

  useEffect(() => {
    // 获得浏览器所有的麦克风列表，以初始化
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const mics = devices
          .filter((device) => device.kind === "audioinput")
        initMics(mics)
      })
      .catch((err) => {
        console.error(err)
      })
  }, [])
}
