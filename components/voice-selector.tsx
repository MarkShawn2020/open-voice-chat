"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, Search, Volume2, Pause, ChevronDown } from "lucide-react"
import React, { useEffect, useState } from "react"

interface VoiceDetails {
  demo_link: string
  language: string
  recommended_scenario: string
  tone_number: string
  voice_type: string
}

interface VoiceItem {
  resource_display: string
  details: VoiceDetails
}

interface VoiceSelectorProps {
  value?: string
  onChange?: (voiceType: string) => void
  trigger?: React.ReactNode
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  value,
  onChange,
  trigger
}) => {
  const [voices, setVoices] = useState<VoiceItem[]>([])
  const [filteredVoices, setFilteredVoices] = useState<VoiceItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [open, setOpen] = useState(false)
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)
  const [playingVoice, setPlayingVoice] = useState<string | null>(null)

  // 加载音色数据
  useEffect(() => {
    const loadVoices = async () => {
      try {
        const response = await fetch('/data/preset-voices.json')
        const data = await response.json()
        setVoices(data)
        setFilteredVoices(data)
      } catch (error) {
        console.error('Failed to load voices:', error)
      }
    }
    loadVoices()
  }, [])

  // 筛选音色
  useEffect(() => {
    let filtered = voices

    // 按搜索词筛选
    if (searchTerm) {
      filtered = filtered.filter(voice =>
        voice.resource_display.toLowerCase().includes(searchTerm.toLowerCase()) ||
        voice.details.recommended_scenario.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // 按分类筛选
    if (selectedCategory !== "all") {
      filtered = filtered.filter(voice => 
        voice.details.recommended_scenario === selectedCategory
      )
    }

    setFilteredVoices(filtered)
  }, [voices, searchTerm, selectedCategory])

  // 获取所有分类
  const categories = React.useMemo(() => {
    const cats = new Set(voices.map(v => v.details.recommended_scenario))
    return Array.from(cats).sort()
  }, [voices])

  // 播放音色示例
  const playVoiceDemo = (demoLink: string, voiceType: string, voiceName: string) => {
    // 如果点击的是正在播放的音色，则暂停
    if (playingVoice === voiceType && currentAudio) {
      currentAudio.pause()
      setCurrentAudio(null)
      setPlayingVoice(null)
      return
    }

    // 停止当前播放的音频
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
    }

    try {
      const audio = new Audio(demoLink)
      setCurrentAudio(audio)
      setPlayingVoice(voiceType)
      
      audio.addEventListener('ended', () => {
        setCurrentAudio(null)
        setPlayingVoice(null)
      })
      
      audio.addEventListener('error', () => {
        console.error(`Failed to play demo for ${voiceName}`)
        setCurrentAudio(null)
        setPlayingVoice(null)
      })

      audio.play().catch((error) => {
        console.error(`Failed to play demo for ${voiceName}:`, error)
        setCurrentAudio(null)
        setPlayingVoice(null)
      })
    } catch (error) {
      console.error(`Error creating audio for ${voiceName}:`, error)
      setPlayingVoice(null)
    }
  }

  // 选择音色
  const selectVoice = (voiceType: string) => {
    onChange?.(voiceType)
    setOpen(false)
  }

  // 获取当前选中音色的显示名称
  const getSelectedVoiceName = () => {
    if (!value) return "选择音色"
    const selectedVoice = voices.find(v => v.details.voice_type === value)
    return selectedVoice?.resource_display || value
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full justify-between text-left">
            <div className="flex items-center gap-2 min-w-0">
              <Volume2 className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{getSelectedVoiceName()}</span>
            </div>
            <ChevronDown className="h-4 w-4 flex-shrink-0" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg">选择音色</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="搜索音色名称或场景..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9"
            />
          </div>

          {/* 分类标签 - 更紧凑 */}
          <div className="flex flex-wrap gap-1">
            <Badge 
              variant={selectedCategory === "all" ? "default" : "secondary"}
              className="cursor-pointer text-xs px-2 py-1"
              onClick={() => setSelectedCategory("all")}
            >
              全部
            </Badge>
            {categories.map(category => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "secondary"}
                className="cursor-pointer text-xs px-2 py-1"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>

          {/* 音色列表 - 更紧凑的网格布局 */}
          <div className="max-h-[55vh] overflow-y-auto">
            {filteredVoices.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                没有找到匹配的音色
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {filteredVoices.map((voice) => {
                  const isSelected = value === voice.details.voice_type
                  const isPlaying = playingVoice === voice.details.voice_type
                  
                  return (
                    <div 
                      key={voice.details.voice_type}
                      className={`relative rounded-lg border p-3 cursor-pointer transition-all hover:border-blue-300 hover:bg-blue-50/50 ${
                        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                      onClick={() => selectVoice(voice.details.voice_type)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm truncate">{voice.resource_display}</h4>
                            <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-5">
                              {voice.details.recommended_scenario}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5">{voice.details.language}</p>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {voice.details.demo_link && (
                            <Button
                              variant={isPlaying ? "default" : "ghost"}
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                playVoiceDemo(voice.details.demo_link, voice.details.voice_type, voice.resource_display)
                              }}
                            >
                              {isPlaying ? (
                                <Pause className="h-3.5 w-3.5" />
                              ) : (
                                <Play className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          )}
                          
                          {isSelected && (
                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}