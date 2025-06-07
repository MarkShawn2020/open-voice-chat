"use client"

import { ChevronDown, ChevronUp, Headphones, Mic, Volume2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { MicControl } from "@/components/mic"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

export const FloatingAudioControl = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // 监听点击外部区域，自动收起面板
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isExpanded && 
        containerRef.current && 
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsExpanded(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isExpanded])

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-50">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <Card className="border-0 shadow-2xl bg-black/90 backdrop-blur-md text-white overflow-hidden p-2">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full h-16 px-4 flex items-center justify-between hover:bg-white/10 border-0"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Headphones className="w-5 h-5 text-green-400" />
                  <div className="text-left">
                    <div className="text-sm font-mono font-bold text-green-400">AUDIO</div>
                    <div className="text-xs text-gray-300">Ready</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30 text-xs font-mono">
                    LIVE
                  </Badge>
                </div>
              </div>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              )}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="p-4 border-t border-white/10">
              <div className="space-y-4">
                {/* 快速状态指示器 */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="space-y-1">
                    <Mic className="w-4 h-4 mx-auto text-green-400" />
                    <div className="text-xs text-gray-300">MIC</div>
                    <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                      ON
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <Volume2 className="w-4 h-4 mx-auto text-blue-400" />
                    <div className="text-xs text-gray-300">SPEAKERS</div>
                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                      85%
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="w-4 h-4 mx-auto rounded-full bg-yellow-400 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-black"></div>
                    </div>
                    <div className="text-xs text-gray-300">LATENCY</div>
                    <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs">
                      24ms
                    </Badge>
                  </div>
                </div>

                {/* 详细控制面板 */}
                <div className="border-t border-white/10 pt-4">
                  <div className="bg-gray-900/50 rounded-lg p-2">
                    <MicControl />
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  )
}
