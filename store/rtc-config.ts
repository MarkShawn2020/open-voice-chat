// RTC 配置 (向后兼容)
import { appConfigAtom } from "@/store/app-config"
import { atom } from "jotai/index"

export interface RTCConfig {
  appId: string
  roomId: string
  uid: string
  token: string
}

// 向后兼容的 RTC 配置原子
export const rtcConfigAtom = atom(
  (get) => get(appConfigAtom).rtc,
  (get, set, newRtcConfig: RTCConfig) => {
    const appConfig = get(appConfigAtom)
    set(appConfigAtom, {
      ...appConfig,
      rtc: newRtcConfig,
    })
  },
)