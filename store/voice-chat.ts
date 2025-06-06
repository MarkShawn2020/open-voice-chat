'use client'

import { atom, createStore as createJotaiStore } from "jotai"
import { exportPages } from "next/dist/export/worker"
import { useEffect } from "react"
import { create } from "zustand"
import { shallow } from "zustand/shallow"

export const isChattingAtom = atom(false)

export const curMicVolumeAtom = atom(0)

export const jotaiStore = createJotaiStore()

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
  toggleMic: () => void
  updateVolume: (value: number) => void
}

export const useMicsStore = create<IMicrophoneManager>((set, get) => ({
  mics: [],
  curMicId: null,
  curMicState: {
    isPermissionGranted: false,
    isOn: false,
    volume: 0,
  },
  toggleMic: () => {
    set({
      curMicState: {
        ...get().curMicState,
        isOn: !get().curMicState.isOn,
      },
    })
  },
  updateVolume: (value: number) => {
    set({
      curMicState: {
        ...get().curMicState,
        volume: value,
      },
    })
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
    // 检查麦克风权限并开始监控
    navigator.mediaDevices.getUserMedia({ audio: { deviceId: id } })
      .then((stream) => {
        // 更新权限状态
        set({ 
          curMicState: { 
            ...get().curMicState, 
            isPermissionGranted: true, 
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


export const useUpdateMicVolume = () => {
  const { curMicState,  updateVolume} = useMicsStore()

  useEffect(() => {
    if(!curMicState.isOn) return

    navigator.mediaDevices.getUserMedia({ audio: { deviceId: id } })
    .then((stream) => {
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
      updateVolume(volume)
    }
  })
  }, [curMicState.isOn])
}