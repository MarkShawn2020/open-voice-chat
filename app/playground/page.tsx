"use client"

import { Phone } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { VoiceCall } from "@/components/voice-call"

export default function PlaygroundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* 背景纹理 */}
      <div className="fixed inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <defs>
            <pattern id="dot-pattern" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
              <circle cx="5" cy="5" r="1" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dot-pattern)" />
        </svg>
      </div>

      <div className="relative z-10">        
        <main className="container mx-auto px-6 py-12">
          {/* 页面标题 */}
          <div className="text-center mb-12">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
              <Phone className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              Voice Playground
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Advanced WebRTC Testing & Real-time Communication Lab
            </p>
            <div className="flex justify-center gap-3">
              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 px-4 py-2 text-sm">
                📞 WebRTC Engine
              </Badge>
              <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 px-4 py-2 text-sm">
                🔬 Testing Lab
              </Badge>
              <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200 px-4 py-2 text-sm">
                ⚡ Real-time
              </Badge>
            </div>
          </div>

          {/* 主要内容区域 */}
          <div className="max-w-4xl mx-auto">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="space-y-6">
                  {/* 功能描述 */}
                  <div className="text-center pb-6 border-b border-gray-200">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-3">
                      WebRTC Communication Testing
                    </h2>
                    <p className="text-gray-600">
                      Test real-time voice communication, audio routing, and WebRTC connectivity in a controlled environment.
                    </p>
                  </div>

                  {/* Voice Call 组件 */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
                    <VoiceCall />
                  </div>

                  {/* 技术信息 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <div className="w-6 h-6 bg-green-500 rounded-full"></div>
                      </div>
                      <h3 className="font-semibold text-gray-800 mb-1">Low Latency</h3>
                      <p className="text-sm text-gray-600">Sub-100ms audio transmission</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
                      </div>
                      <h3 className="font-semibold text-gray-800 mb-1">High Quality</h3>
                      <p className="text-sm text-gray-600">Crystal clear audio codec</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <div className="w-6 h-6 bg-purple-500 rounded-full"></div>
                      </div>
                      <h3 className="font-semibold text-gray-800 mb-1">P2P Direct</h3>
                      <p className="text-sm text-gray-600">Direct peer connection</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
