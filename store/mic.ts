"use client"

import { useEffect } from "react"
import { create } from "zustand"

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
    if (mics.length > 0) {
      get().changeMic(mics[0]!.deviceId)
    }
  },
  changeMic: (id: string) => {
    set({ curMicId: id })
    // 检查麦克风权限并开始监控
    navigator.mediaDevices.getUserMedia({ audio: { deviceId: id } }).then((stream) => {
      // 更新权限状态
      set({
        curMicState: {
          ...get().curMicState,
          isPermissionGranted: true,
        },
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
        const mics = devices.filter((device) => device.kind === "audioinput")
        initMics(mics)
      })
      .catch((err) => {
        console.error(err)
      })
  }, [])
}

export const useUpdateMicVolume = () => {
  const { curMicState, updateVolume, curMicId } = useMicsStore()

  useEffect(() => {
    if (!curMicState.isOn || !curMicId) return

    let stream: MediaStream | null = null
    let audioContext: AudioContext | null = null
    let source: MediaStreamAudioSourceNode | null = null
    let processor: ScriptProcessorNode | null = null

    navigator.mediaDevices
      .getUserMedia({ audio: { deviceId: curMicId } })
      .then((mediaStream) => {
        stream = mediaStream
        audioContext = new AudioContext()
        source = audioContext.createMediaStreamSource(stream)
        processor = audioContext.createScriptProcessor(4096, 1, 1)

        source.connect(processor)
        processor.connect(audioContext.destination)

        processor.onaudioprocess = (e) => {
          const input = e.inputBuffer.getChannelData(0)
          const sum = input.reduce((a, b) => a + Math.abs(b), 0)
          const volume = Math.min((sum / input.length) * 10, 1) // 放大并限制在0-1范围
          console.log({ volume })
          updateVolume(volume)
        }
      })
      .catch((err) => {
        console.error("Failed to get user media:", err)
      })

    // 清理函数
    return () => {
      console.log("Cleaning up audio resources")

      updateVolume(0)

      // 停止音频处理
      if (processor) {
        processor.onaudioprocess = null
        processor.disconnect()
      }

      // 断开音频源连接
      if (source) {
        source.disconnect()
      }

      // 停止媒体流轨道
      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop()
        })
      }

      // 关闭音频上下文
      if (audioContext && audioContext.state !== "closed") {
        audioContext.close()
      }
    }
  }, [curMicState.isOn, curMicId, updateVolume])
}
