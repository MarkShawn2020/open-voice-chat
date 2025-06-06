"use client"

import { useAtom } from "jotai"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { isChattingAtom, useInitMics, useMicsStore } from "../store/voice-chat"

const CurMicVolume = () => {
  const { curMicState } = useMicsStore()

  return (
    <div>
      <div className="flex items-center space-x-2 text-xs">
        <span className="w-12 text-gray-600">Volume:</span>
        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-red-500 transition-all duration-100"
            style={{ width: `${Math.min(curMicState.volume * 100, 100)}%` }}
          ></div>
        </div>
        <span className="w-8 text-xs text-gray-500">{Math.round(curMicState.volume * 100)}%</span>
      </div>
    </div>
  )
}

const Mics = () => {
  const { mics, changeMic, curMicId, curMicState } = useMicsStore((state) => ({
    mics: state.mics,
    changeMic: state.changeMic,
    curMicId: state.curMicId,
    curMicState: {
      isPermissionGranted: state.curMicState.isPermissionGranted,
      isOn: state.curMicState.isOn,
    },
  }))

  useInitMics()

  console.log({ mics, curMicId })

  return (
    <div className="mx-auto w-full max-w-md">
      <h3 className="mb-4 text-center text-lg font-semibold">Select Microphone</h3>
      <div className="space-y-3">
        {mics.map((mic, index) => {
          const isSelected = curMicId === mic.deviceId
          return (
            <div
              key={index}
              className={`flex items-center space-x-3 rounded-lg border p-3 transition-colors ${
                isSelected ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"
              }`}
            >
              <Checkbox id={`mic-${index}`} checked={isSelected} onCheckedChange={() => changeMic(mic.deviceId)} />
              <div className="min-w-0 flex-1">
                <Label
                  htmlFor={`mic-${index}`}
                  className="block cursor-pointer truncate text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {mic.label || `Microphone ${index + 1}`}
                </Label>
                {isSelected && (
                  <div className="mt-2 space-y-1">
                    {/* 权限状态 */}
                    <div className="flex items-center space-x-2 text-xs">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          curMicState.isPermissionGranted ? "bg-green-500" : "bg-red-500"
                        }`}
                      ></div>
                      <span className="text-gray-600">
                        {curMicState.isPermissionGranted ? "Permission Granted" : "Permission Denied"}
                      </span>
                    </div>

                    {/* 开关状态 */}
                    <div className="flex items-center space-x-2 text-xs">
                      <div
                        className={`h-2 w-2 rounded-full ${curMicState.isOn ? "bg-green-500" : "bg-gray-400"}`}
                      ></div>
                      <span className="text-gray-600">{curMicState.isOn ? "Active" : "Inactive"}</span>
                    </div>

                    {/* 音量指示器 */}
                    <CurMicVolume />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const Main = () => {
  const [isChatting, setIsChatting] = useAtom(isChattingAtom)

  return (
    <>
      <Button onClick={() => setIsChatting(!isChatting)}>{isChatting ? "Stop Chat" : "Start Chat"}</Button>
      <div>{isChatting ? "Chatting" : "Not Chatting"}</div>
    </>
  )
}

export default function Web() {
  return (
    <div className="margin-auto flex flex-col items-center gap-2">
      <Mics />

      <Main />
    </div>
  )
}
