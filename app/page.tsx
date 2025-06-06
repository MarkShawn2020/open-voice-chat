"use client"

import { useAtom } from "jotai"
import { MessageCircle, Mic, MicOff, Phone, Settings, Sparkles, Users, Zap } from "lucide-react"

import { Config } from "@/components/config"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VoiceCall } from "@/components/voice-call"
import { isChattingAtom } from "@/store/global"

const Main = () => {
  const [isChatting, setIsChatting] = useAtom(isChattingAtom)

  return (
    <div className="space-y-6">
      {/* AI Assistant Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI Voice Assistant
          </CardTitle>
          <CardDescription className="text-base text-gray-600">
            Powered by ByteDance Doubao AI • Real-time conversations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <Button 
              onClick={() => setIsChatting(!isChatting)}
              size="lg"
              className={`
                px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105
                ${isChatting 
                  ? "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-lg hover:shadow-red-500/25" 
                  : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-blue-500/25"
                }
              `}
            >
              {isChatting ? (
                <>
                  <MicOff className="w-5 h-5 mr-2" />
                  Stop Conversation
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5 mr-2" />
                  Start Conversation
                </>
              )}
            </Button>
          </div>
          
          <div className="text-center">
            <Badge 
              variant={isChatting ? "default" : "secondary"}
              className={`
                px-4 py-2 text-sm font-medium
                ${isChatting 
                  ? "bg-green-100 text-green-700 border-green-200" 
                  : "bg-gray-100 text-gray-600 border-gray-200"
                }
              `}
            >
              {isChatting ? "🟢 Active Conversation" : "⚫ Ready to Start"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <Zap className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
            <h3 className="font-semibold text-gray-800">Real-time</h3>
            <p className="text-sm text-gray-600">Ultra-low latency voice chat</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <h3 className="font-semibold text-gray-800">AI Personas</h3>
            <p className="text-sm text-gray-600">Customizable personalities</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <Phone className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <h3 className="font-semibold text-gray-800">WebRTC</h3>
            <p className="text-sm text-gray-600">High-quality audio</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function Web() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />
      
      <div className="relative container mx-auto max-w-6xl p-6 min-h-screen flex flex-col">
        {/* Header Section */}
        <header className="text-center mb-12 flex-shrink-0">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6 shadow-lg">
            <MessageCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Open Voice Chat
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            Experience natural AI conversations with enterprise-grade real-time voice technology
          </p>
          <div className="flex justify-center gap-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
              🚀 Open Source
            </Badge>
            <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
              ⚡ Real-time
            </Badge>
            <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
              🤖 AI Powered
            </Badge>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 min-h-0">
          <Tabs defaultValue="voice-call" className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-sm p-1 h-14">
              <TabsTrigger 
                value="config" 
                className="flex items-center gap-2 font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm h-12"
              >
                <Settings className="w-4 h-4" />
                Configuration
              </TabsTrigger>
              <TabsTrigger 
                value="voice-call" 
                className="flex items-center gap-2 font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm h-12"
              >
                <Phone className="w-4 h-4" />
                Voice Call
              </TabsTrigger>
              <TabsTrigger 
                value="ai-chat" 
                className="flex items-center gap-2 font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm h-12"
              >
                <MessageCircle className="w-4 h-4" />
                AI Chat
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 min-h-0">
              <TabsContent value="config" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border-0 p-6 h-full overflow-auto">
                  <Config />
                </div>
              </TabsContent>
              
              <TabsContent value="voice-call" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border-0 p-6 h-full overflow-auto">
                  <VoiceCall />
                </div>
              </TabsContent>
              
              <TabsContent value="ai-chat" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
                <div className="h-full overflow-auto">
                  <Main />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Footer */}
        <footer className="text-center mt-12 py-6 border-t border-white/20 flex-shrink-0">
          <p className="text-sm text-gray-500">
            Built with ❤️ using Next.js, ByteDance Doubao AI, and VolcEngine RTC
          </p>
        </footer>
      </div>
    </div>
  )
}
