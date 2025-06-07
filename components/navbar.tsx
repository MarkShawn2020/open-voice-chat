"use client"

import { Github, MessageCircle } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { SettingsModal } from "@/components/settings-modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export const Navbar = () => {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-white/20 bg-white/90 backdrop-blur-md">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-sm">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Open Voice Chat
              </h1>
            </div>
            <div className="hidden sm:flex items-center gap-2 ml-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 text-xs px-2 py-1">
                🚀 Open Source
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200 text-xs px-2 py-1">
                🤖 AI Powered
              </Badge>
            </div>
          </Link>

          {/* Navigation & Actions */}
          <div className="flex items-center gap-4">
            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              <Link 
                href="/"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  pathname === "/" 
                    ? "bg-blue-100 text-blue-700 shadow-sm" 
                    : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                }`}
              >
                Home
              </Link>
              <Link 
                href="/playground"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  pathname === "/playground" 
                    ? "bg-green-100 text-green-700 shadow-sm" 
                    : "text-gray-600 hover:text-green-600 hover:bg-green-50"
                }`}
              >
                Playground
              </Link>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <a
                  href="https://github.com/markshawn2020/open-voice-chat"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <Github className="w-4 h-4" />
                  <span className="hidden sm:inline">GitHub</span>
                </a>
              </Button>

              <SettingsModal />
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
