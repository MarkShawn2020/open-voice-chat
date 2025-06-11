"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { TTSService } from "@/lib/tts-api"
import { useAtom } from "jotai"
import { atomWithStorage, RESET } from "jotai/utils"
import { ChevronDown, Pause, Play, RotateCcw, Search, Type, Volume2 } from "lucide-react"
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
  ttsConfig?: {
    appId: string
    accessToken: string
  }
}

const customTextForVoiceAtom = atomWithStorage("customTextForVoice", "你好，我是AI语音助手，很高兴为您服务！")
const useCustomTextForVoiceAtom = atomWithStorage("useCustomTextForVoice", false)

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({ value, onChange, trigger, ttsConfig }) => {
  const [voices, setVoices] = useState<VoiceItem[]>([])
  const [filteredVoices, setFilteredVoices] = useState<VoiceItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [open, setOpen] = useState(false)
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)
  const [playingVoice, setPlayingVoice] = useState<string | null>(null)
  const [customText, setCustomText] = useAtom(customTextForVoiceAtom)
  const [useCustomText, setUseCustomText] = useAtom(useCustomTextForVoiceAtom)
  const [isGeneratingAudio, setIsGeneratingAudio] = useState<string | null>(null)
  const [generatedAudioUrls, setGeneratedAudioUrls] = useState<Map<string, string>>(new Map())

  // 加载音色数据
  useEffect(() => {
    const loadVoices = async () => {
      try {
        const response = await fetch("/data/preset-voices.json")
        const data = await response.json()
        setVoices(data)
        setFilteredVoices(data)
      } catch (error) {
        console.error("Failed to load voices:", error)
      }
    }
    loadVoices()
  }, [])

  // 筛选音色
  useEffect(() => {
    let filtered = voices

    // 按搜索词筛选
    if (searchTerm) {
      filtered = filtered.filter(
        (voice) =>
          voice.resource_display.toLowerCase().includes(searchTerm.toLowerCase()) ||
          voice.details.recommended_scenario.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // 按分类筛选
    if (selectedCategory !== "all") {
      filtered = filtered.filter((voice) => voice.details.recommended_scenario === selectedCategory)
    }

    setFilteredVoices(filtered)
  }, [voices, searchTerm, selectedCategory])

  // 组件卸载时清理所有生成的音频URL
  useEffect(() => {
    return () => {
      generatedAudioUrls.forEach((url) => {
        TTSService.cleanupAudioUrl(url)
      })
    }
  }, [])

  // 获取所有分类
  const categories = React.useMemo(() => {
    const cats = new Set(voices.map((v) => v.details.recommended_scenario))
    return Array.from(cats).sort()
  }, [voices])

  // 生成自定义文字的TTS音频
  const generateCustomTTS = async (voiceType: string, text: string) => {
    if (!ttsConfig?.appId || !ttsConfig?.accessToken) {
      console.error("TTS config not provided")
      return null
    }

    try {
      setIsGeneratingAudio(voiceType)

      // 使用火山引擎TTS API生成语音
      const audioUrl = await TTSService.generateSpeech({
        text,
        voiceType,
        config: ttsConfig,
      })

      // 缓存生成的音频URL
      if (audioUrl) {
        const cacheKey = `${voiceType}-${text}`
        setGeneratedAudioUrls((prev) => {
          const newMap = new Map(prev)
          // 清理之前缓存的同一音色文字的URL
          const oldUrl = newMap.get(cacheKey)
          if (oldUrl) {
            TTSService.cleanupAudioUrl(oldUrl)
          }
          newMap.set(cacheKey, audioUrl)
          return newMap
        })
      }

      return audioUrl
    } catch (error) {
      console.error("Failed to generate TTS:", error)
      // 可以在这里添加用户提示
      if (error instanceof Error) {
        console.error("TTS错误详情:", error.message)
      }
      return null
    } finally {
      setIsGeneratingAudio(null)
    }
  }

  // 播放音色示例
  const playVoiceDemo = async (demoLink: string, voiceType: string, voiceName: string, customTextToUse?: string) => {
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
      let audioUrl = demoLink

      // 如果使用自定义文字且有TTS配置，生成自定义音频
      if (customTextToUse && useCustomText && ttsConfig) {
        const cacheKey = `${voiceType}-${customTextToUse}`
        let customAudioUrl = generatedAudioUrls.get(cacheKey)

        // 如果没有缓存，生成新的音频
        if (!customAudioUrl) {
          customAudioUrl = await generateCustomTTS(voiceType, customTextToUse)
        }

        if (customAudioUrl) {
          audioUrl = customAudioUrl
        }
      }

      const audio = new Audio(audioUrl)
      setCurrentAudio(audio)
      setPlayingVoice(voiceType)

      audio.addEventListener("ended", () => {
        setCurrentAudio(null)
        setPlayingVoice(null)
      })

      audio.addEventListener("error", () => {
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
    // setOpen(false)
  }

  // 获取当前选中音色的显示名称
  const getSelectedVoiceName = () => {
    if (!value) return "选择音色"
    const selectedVoice = voices.find((v) => v.details.voice_type === value)
    return selectedVoice?.resource_display || value
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full justify-between text-left">
            <div className="flex min-w-0 items-center gap-2">
              <Volume2 className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{getSelectedVoiceName()}</span>
            </div>
            <ChevronDown className="h-4 w-4 flex-shrink-0" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-hidden">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg">选择音色</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* 自定义文字试音 */}
          <div className="space-y-2 border-b pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">自定义文字试音（需要TTS配置）</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={useCustomText}
                    onChange={(e) => setUseCustomText(e.target.checked)}
                    className="mr-1"
                  />
                  启用
                </label>
                {useCustomText && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setCustomText(RESET)}
                    title="重置为默认文字"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            {useCustomText && (
              <div className="space-y-2">
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="输入想要试听的文字..."
                  className="h-16 w-full resize-none rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  maxLength={200}
                />
                <div className="flex items-center justify-end text-xs text-gray-500">
                  <span>{customText.length}/200</span>
                </div>
              </div>
            )}
          </div>

          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="搜索音色名称或场景..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 pl-10"
            />
          </div>

          {/* 分类标签 - 更紧凑 */}
          <div className="flex flex-wrap gap-1">
            <Badge
              variant={selectedCategory === "all" ? "default" : "secondary"}
              className="cursor-pointer px-2 py-1 text-xs"
              onClick={() => setSelectedCategory("all")}
            >
              全部
            </Badge>
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "secondary"}
                className="cursor-pointer px-2 py-1 text-xs"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>

          {/* 音色列表 - 更紧凑的网格布局 */}
          <div className="max-h-[55vh] overflow-y-auto">
            {filteredVoices.length === 0 ? (
              <div className="py-12 text-center text-gray-500">没有找到匹配的音色</div>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {filteredVoices.map((voice) => {
                  const isSelected = value === voice.details.voice_type
                  const isPlaying = playingVoice === voice.details.voice_type

                  return (
                    <div
                      key={voice.details.voice_type}
                      className={`relative cursor-pointer rounded-lg border p-3 transition-all hover:border-blue-300 hover:bg-blue-50/50 ${
                        isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200"
                      }`}
                      onClick={() => selectVoice(voice.details.voice_type)}
                    >
                      {isSelected && <div className="absolute top-1 right-1 h-2 w-2 rounded-full bg-blue-500" />}
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="truncate text-sm font-medium">{voice.resource_display}</h4>
                            <Badge variant="outline" className="h-5 px-1.5 py-0.5 text-xs">
                              {voice.details.recommended_scenario}
                            </Badge>
                          </div>
                          <p className="mt-0.5 text-xs text-gray-600">{voice.details.language}</p>
                        </div>

                        <div className="relative flex flex-shrink-0 items-center gap-2">
                          {voice.details.demo_link && (
                            <Button
                              variant={isPlaying ? "default" : "ghost"}
                              size="sm"
                              className="relative h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                playVoiceDemo(
                                  voice.details.demo_link,
                                  voice.details.voice_type,
                                  voice.resource_display,
                                  useCustomText ? customText : undefined
                                )
                              }}
                              disabled={isGeneratingAudio === voice.details.voice_type}
                              title={useCustomText ? "试听自定义文字" : "试听音色示例"}
                            >
                              {isGeneratingAudio === voice.details.voice_type ? (
                                <>
                                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                </>
                              ) : isPlaying ? (
                                <Pause className="h-3.5 w-3.5" />
                              ) : (
                                <Play className="h-3.5 w-3.5" />
                              )}

                              {/* {useCustomText && (
                                <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-blue-500" />
                              )} */}
                            </Button>
                          )}

                          {/* {isSelected && <div className="h-2 w-2 rounded-full bg-blue-500" />} */}
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
