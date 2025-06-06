import { atom } from "jotai"
import { atomWithImmer } from "jotai-immer"
import { useEffect } from "react"
import { create } from "zustand"

export const isChattingAtom = atom(false)

export interface IMicrophone extends MediaDeviceInfo {
  isPermissionGranted: boolean
  isOn: boolean
}
export interface IMicrophoneManager {
  mics: IMicrophone[]
  curMicId: string | null
  curMic: () => IMicrophone | undefined
  initMics: (mics: IMicrophone[]) => void
  changeMic: (id: string) => void
}

export const useMicsStore = create<IMicrophoneManager>((set, get) => ({
  mics: [],
  curMicId: null,
  curMic: () => {
    return get().mics.find((mic) => mic.deviceId === get().curMicId)
  },
  initMics: (mics: IMicrophone[]) => {
    console.log("init mics", mics)
    set({ mics })
  },
  changeMic: (id: string) => {
    set({ curMicId: id })
  },
}))

export const useInitMics = () => {
  const { initMics } = useMicsStore()

  useEffect(() => {
    console.log("init mics")

    // 获得浏览器所有的麦克风列表，以初始化
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const mics = devices
          .filter((device) => device.kind === "audioinput")
          .map((device) => ({
            ...device.toJSON(),
            isPermissionGranted: false,
            isOn: false,
          }))

        initMics(mics)
      })
      .catch((err) => {
        console.error(err)
      })
  }, [])
}
