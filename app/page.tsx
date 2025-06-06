"use client"

import { useAtom } from "jotai"

import { Config } from "@/components/config"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VoiceCall } from "@/components/voice-call"
import { isChattingAtom } from "@/store/global"

const Main = () => {
  const [isChatting, setIsChatting] = useAtom(isChattingAtom)

  return (
    <Card>
      <CardHeader>
        <CardTitle>智能语音助手</CardTitle>
        <CardDescription>基于豆包AI的实时语音对话系统</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={() => setIsChatting(!isChatting)}>
          {isChatting ? "停止对话" : "开始对话"}
        </Button>
        <div className="text-center text-sm text-gray-600">
          {isChatting ? "正在对话中..." : "等待开始对话"}
        </div>
      </CardContent>
    </Card>
  )
}

export default function Web() {
  return (
    <div className="container mx-auto max-w-4xl p-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Open Voice Chat</h1>
        <p className="text-gray-600">实时语音对话AI系统</p>
      </div>

      <Tabs defaultValue="voice-call" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="config">系统配置</TabsTrigger>
          <TabsTrigger value="voice-call">语音通话</TabsTrigger>
          <TabsTrigger value="ai-chat">AI对话</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="mt-6">
          <Config />
        </TabsContent>
                
        <TabsContent value="voice-call" className="mt-6">
          <VoiceCall />
        </TabsContent>
        
        <TabsContent value="ai-chat" className="mt-6">
          <Main />
        </TabsContent>
      </Tabs>
    </div>
  )
}
