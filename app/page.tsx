'use client';

import { useAtom } from "jotai";
import { isChattingAtom, useInitMics, useMicsStore } from "../store/voice-chat";
import { Button } from "@/components/ui/button";

const Mics = () => {

  const {mics, changeMic} = useMicsStore()

  useInitMics()

  return (
    <div className="flex flex-col items-center gap-2">
    {mics.map((mic, index) => (
      <Button key={index} onClick={() => changeMic(mic.deviceId)}>{mic.label}</Button>
    ))}
    </div>
  )
}

const Main = () => {
  const [isChatting, setIsChatting] = useAtom(isChattingAtom)

  if(!isChatting) {
    return (
      <Button onClick={() => setIsChatting(true)}>Start Chat</Button>
    )
  }

  return (
    <div>Chatting </div>
  )
}

export default function Web() {

  return (
    <div className="flex flex-col items-center margin-auto gap-2">
    <Mics/>

    <Main/>
    </div>
  )
}
