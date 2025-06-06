'use client';

import { useAtom } from "jotai";
import { isChattingAtom, selectedMicrophoneAtom } from "../store/voice-chat";
import { Button } from "@/components/ui/button";

export default function Web() {
  const [isChatting, setIsChatting] = useAtom(isChattingAtom)
  const [selectedMic, setSelectedMic] = useAtom(selectedMicrophoneAtom)


  if(!isChatting) {
    return (
      <Button onClick={() => setIsChatting(true)}>Start Chat</Button>
    )
  }

  return (
    <>

      hello world

    </>
  )
}
