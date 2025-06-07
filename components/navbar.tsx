"use client"

import { Github, MessageCircle, Sparkles } from "lucide-react"

import { SettingsModal } from "@/components/settings-modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export const Navbar = () => {
  return (
    <nav className="sticky top-0 z-40 w-full border-b border-white/20 bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Open Voice Chat
              </h1>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                🚀 Open Source
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200 text-xs">
                🤖 AI Powered
              </Badge>
            </div>
          </div>

          {/* Navigation Actions */}
          <div className="flex items-center gap-3">
            <SettingsModal />
            
            <Button 
              variant="ghost" 
              size="sm"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              asChild
            >
              <a 
                href="https://github.com/markshawn2020/open-voice-chat" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Github className="w-4 h-4" />
                GitHub
              </a>
            </Button>

            <Button 
              size="sm"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
