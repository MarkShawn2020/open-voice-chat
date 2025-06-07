"use client"

import { useAtom } from "jotai"
import { MessageCircle, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { isChattingAtom } from "@/store/global"

export default function Web() {
  const [isChatting] = useAtom(isChattingAtom)

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
        {/* Main Content */}
        <main className="container mx-auto px-6 py-12">
          <div className="max-w-5xl mx-auto">
            {/* AI Chat - 主产品 */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="h-full flex flex-col">
                  {/* AI Chat Header */}
                  <div className="flex-shrink-0 text-center pb-8 border-b border-gray-200">
                    <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
                      <MessageCircle className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      AI Voice Chat
                    </h1>
                    <p className="text-xl text-gray-600 mb-6">
                      Real-time Voice Conversation with AI • Powered by ByteDance Doubao
                    </p>
                    <div className="flex justify-center gap-3">
                      <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 px-4 py-2 text-sm">
                        🤖 AI Personas
                      </Badge>
                      <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200 px-4 py-2 text-sm">
                        🎙️ Real-time Voice
                      </Badge>
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 px-4 py-2 text-sm">
                        📞 WebRTC
                      </Badge>
                    </div>
                  </div>

                  {/* Chat Interface */}
                  <div className="flex-grow py-8">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 min-h-[400px] flex flex-col items-center justify-center">
                      <div className="text-center max-w-2xl">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                          Start Your AI Conversation
                        </h3>
                        <p className="text-gray-600 mb-8 leading-relaxed">
                          Experience natural voice conversations with advanced AI. Choose from different AI personas, 
                          speak naturally, and get intelligent responses in real-time.
                        </p>
                        
                        {/* Quick Features */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                          <div className="text-center p-4 bg-white/60 rounded-lg">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                              <MessageCircle className="w-6 h-6 text-blue-600" />
                            </div>
                            <h4 className="font-semibold text-gray-800 mb-2">Natural Speech</h4>
                            <p className="text-sm text-gray-600">Speak naturally and get instant AI responses</p>
                          </div>
                          <div className="text-center p-4 bg-white/60 rounded-lg">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                              <Sparkles className="w-6 h-6 text-purple-600" />
                            </div>
                            <h4 className="font-semibold text-gray-800 mb-2">AI Personas</h4>
                            <p className="text-sm text-gray-600">Choose from various AI personalities</p>
                          </div>
                          <div className="text-center p-4 bg-white/60 rounded-lg">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                              <div className="w-6 h-6 bg-green-500 rounded-full animate-pulse"></div>
                            </div>
                            <h4 className="font-semibold text-gray-800 mb-2">Real-time</h4>
                            <p className="text-sm text-gray-600">Ultra-low latency voice processing</p>
                          </div>
                        </div>

                        <div className="flex justify-center">
                          <Button 
                            size="lg" 
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                          >
                            {isChatting ? (
                              <>
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-3"></div>
                                Stop Conversation
                              </>
                            ) : (
                              <>
                                <MessageCircle className="w-5 h-5 mr-3" />
                                Start AI Chat
                              </>
                            )}
                          </Button>
                        </div>
                        
                        {isChatting && (
                          <div className="mt-6 flex justify-center gap-3">
                            <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                              🟢 Connected
                            </Badge>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                              🎙️ Listening
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

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
