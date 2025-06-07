// RTC 状态
import { IRTCEngine } from "@volcengine/rtc"
import { atom } from "jotai/index"

export interface RTCState {
  engine: IRTCEngine | null
  isConnected: boolean
  isLocalAudioEnabled: boolean
  isRemoteAudioEnabled: boolean
  remoteUsers: string[]
  error: string | null
}

export const rtcStateAtom = atom<RTCState>({
  engine: null,
  isConnected: false,
  isLocalAudioEnabled: false,
  isRemoteAudioEnabled: false,
  remoteUsers: [],
  error: null,
})