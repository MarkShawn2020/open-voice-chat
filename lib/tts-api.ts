/**
 * 火山引擎大模型语音合成API集成
 * 通过Server Action调用以解决CORS问题
 */

import { generateTTSSpeech } from './tts-server-action'

export interface TTSConfig {
  appId: string
  accessToken: string
}

export interface TTSRequest {
  text: string
  voiceType: string
  config: TTSConfig
}

export class TTSService {
  /**
   * 调用火山引擎TTS API生成语音（通过Server Action）
   * @param request TTS请求参数
   * @returns 音频URL或null
   */
  static async generateSpeech(request: TTSRequest): Promise<string | null> {
    console.info('[generateSpeech] ', request)
    const { text, voiceType, config } = request

    if (!config.appId || !config.accessToken) {
      console.error('TTS config is incomplete')
      return null
    }

    try {
      // 通过Server Action调用TTS API
      const result = await generateTTSSpeech({
        text,
        voiceType,
        appId: config.appId,
        accessToken: config.accessToken
      })

      if (result.success && result.audioUrl) {
        // 如果返回的是data URL，直接返回
        if (result.audioUrl.startsWith('data:')) {
          return result.audioUrl
        }
        
        // 如果返回的是base64数据，转换为data URL
        return `data:audio/mp3;base64,${result.audioUrl}`
      } else {
        console.error('TTS Server Action error:', result.error)
        return null
      }
      
    } catch (error) {
      console.error('Failed to generate TTS via Server Action:', error)
      return null
    }
  }

  /**
   * 清理之前创建的音频URL以释放内存
   * @param audioUrl 要清理的音频URL
   */
  static cleanupAudioUrl(audioUrl: string) {
    // Data URLs不需要手动清理，但我们可以在这里做其他清理工作
    // 比如清理缓存等
    if (audioUrl && audioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(audioUrl)
    }
    // Data URLs会被垃圾回收器自动处理
  }
}