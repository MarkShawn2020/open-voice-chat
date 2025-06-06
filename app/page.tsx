'use client';

import { useAtom } from "jotai";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { isChattingAtom, useInitMics, useMicsStore } from "../store/voice-chat";

const Mics = () => {

  const { mics, changeMic, curMicId } = useMicsStore()

  useInitMics()

  console.log({ mics, curMicId })


  return (
    <div className="w-full max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-4 text-center">Select Microphone</h3>
      <div className="space-y-3">
        {mics.map((mic, index) => (
          <div key={index} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
            <Checkbox
              id={`mic-${index}`}
              checked={curMicId === mic.deviceId}
              onCheckedChange={() => changeMic(mic.deviceId)}
            />
            <Label
              htmlFor={`mic-${index}`}
              className="flex-1 cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {mic.label || `Microphone ${index + 1}`}
            </Label>
          </div>
        ))}
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
