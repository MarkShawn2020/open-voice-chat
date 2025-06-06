'use client';

import { useAtom } from "jotai";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { isChattingAtom, useInitMics, useMicsStore } from "../store/voice-chat";

const Mics = () => {

  const { mics, changeMic, curMicId, curMicState } = useMicsStore()

  useInitMics()

  console.log({ mics, curMicId })

  return (
    <div className="w-full max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-4 text-center">Select Microphone</h3>
      <div className="space-y-3">
        {mics.map((mic, index) => {
          const isSelected = curMicId === mic.deviceId
          return (
            <div key={index} className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
              isSelected ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
            }`}>
              <Checkbox
                id={`mic-${index}`}
                checked={isSelected}
                onCheckedChange={() => changeMic(mic.deviceId)}
              />
              <div className="flex-1 min-w-0">
                <Label
                  htmlFor={`mic-${index}`}
                  className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block truncate"
                >
                  {mic.label || `Microphone ${index + 1}`}
                </Label>
                {isSelected && (
                  <div className="mt-2 space-y-1">
                    {/* 权限状态 */}
                    <div className="flex items-center space-x-2 text-xs">
                      <div className={`w-2 h-2 rounded-full ${
                        curMicState.isPermissionGranted ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <span className="text-gray-600">
                        {curMicState.isPermissionGranted ? 'Permission Granted' : 'Permission Denied'}
                      </span>
                    </div>
                    
                    {/* 开关状态 */}
                    <div className="flex items-center space-x-2 text-xs">
                      <div className={`w-2 h-2 rounded-full ${
                        curMicState.isOn ? 'bg-green-500' : 'bg-gray-400'
                      }`}></div>
                      <span className="text-gray-600">
                        {curMicState.isOn ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    {/* 音量指示器 */}
                    {curMicState.isPermissionGranted && (
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="text-gray-600 w-12">Volume:</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2 relative overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-green-400 to-red-500 h-full transition-all duration-100"
                            style={{ width: `${Math.min(curMicState.volume * 100, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-gray-500 text-xs w-8">
                          {Math.round(curMicState.volume * 100)}%
                        </span>
                      </div>
                    )}
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
    <div className="flex flex-col items-center margin-auto gap-2">
      <Mics />

      <Main />
    </div>
  )
}
