"use client"

import { useAtom } from "jotai"
import { MessageCircle, Mic, MicOff, Phone, Sparkles, Users, Zap } from "lucide-react"

import { FloatingAudioControl } from "@/components/floating-audio-control"
import { Navbar } from "@/components/navbar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { VoiceCall } from "@/components/voice-call"
import { isChattingAtom } from "@/store/global"

const AIChat = () => {
  const [isChatting, setIsChatting] = useAtom(isChattingAtom)

  return (
    <div className="h-full flex flex-col">
      {/* AI Chat Header */}
      <div className="flex-shrink-0 text-center pb-6">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          AI Voice Assistant
        </h2>
        <p className="text-gray-600 mb-4">
          Powered by ByteDance Doubao AI • Real-time conversations
        </p>
        <div className="flex justify-center gap-2 mb-6">
          <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
            ⚡ Real-time
          </Badge>
          <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
            🤖 AI Powered
          </Badge>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center mb-6">
          <div className="text-center text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-lg font-medium mb-2">AI Chat Interface</p>
            <p className="text-sm">Start a conversation to see messages here</p>
          </div>
        </div>

        {/* Control Button */}
        <div className="flex-shrink-0 flex flex-col items-center space-y-4">
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
      </div>
    </div>
  )
}

const VoicePlayground = () => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 text-center pb-6">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center mb-4">
          <Phone className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
          Voice Playground
        </h2>
        <p className="text-gray-600 mb-4">
          WebRTC Real-time Communication • Advanced Testing
        </p>
        <div className="flex justify-center gap-2 mb-6">
          <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
            📞 WebRTC
          </Badge>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
            🔧 Advanced
          </Badge>
        </div>
      </div>

      <div className="flex-1">
        <VoiceCall />
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
      
      <div className="relative min-h-screen flex flex-col">
        {/* Navigation */}
        <Navbar />
        
        {/* Main Content */}
        <div className="flex-1 container mx-auto max-w-7xl p-6">
          {/* Features Overview */}
          <div className="mb-8">
            <div className="text-center mb-6">
              <h1 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Experience Natural AI Conversations
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Enterprise-grade real-time voice technology meets intelligent AI personas
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[800px]">
            {/* Left: AI Chat (Main Product) */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 h-full">
                <AIChat />
              </CardContent>
            </Card>

            {/* Right: Voice Playground */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 h-full">
                <VoicePlayground />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-12 py-6 border-t border-white/20 flex-shrink-0">
          <p className="text-sm text-gray-500">
            Built with ❤️ using Next.js, ByteDance Doubao AI, and VolcEngine RTC
          </p>
        </footer>
      </div>

      {/* Floating Audio Control */}
      <FloatingAudioControl />
    </div>
  )
}
