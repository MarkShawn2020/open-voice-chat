"use client"

import { Mics } from "@/components/mic"
import { Button } from "@/components/ui/button"
import {isChattingAtom} from "@/store/global";
import { useAtom } from "jotai"

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
