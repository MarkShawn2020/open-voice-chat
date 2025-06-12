'use server'

/**
 * 火山引擎TTS Server Action
 * 解决前端直接调用API的CORS问题
 */

export interface TTSRequest {
  text: string
  voiceType: string
  appId: string
  accessToken: string
}

export interface TTSResponse {
  success: boolean
  audioUrl?: string
  error?: string
}

export async function generateTTSSpeech(request: TTSRequest): Promise<TTSResponse> {
  const { text, voiceType, appId, accessToken } = request

  if (!appId || !accessToken) {
    return {
      success: false,
      error: 'TTS配置不完整：缺少appId或accessToken'
    }
  }

  try {
    // 构建请求体，遵循火山引擎API格式
    const requestBody = {
      app: {
        appid: appId,
        token: accessToken,
        cluster: "volcano_tts"
      },
      user: {
        uid: `user_${Date.now()}`
      },
      audio: {
        voice_type: voiceType,
        encoding: "mp3",
        speed_ratio: 1.0,
        rate: 24000
      },
      request: {
        reqid: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text: text.substring(0, 200), // 限制文本长度
        operation: "query"
      }
    }

    // 调用火山引擎TTS API
    const response = await fetch('https://openspeech.bytedance.com/api/v1/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer;${accessToken}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json() as { code: number; data?: string; message?: string }
    
    if (data.code === 3000 && data.data) {
      // 返回base64编码的音频数据
      const audioBase64 = data.data
      
      return {
        success: true,
        audioUrl: `data:audio/mp3;base64,${audioBase64}`
      }
    } else {
      const errorMessage = data.message || `TTS API错误 (code: ${data.code})`
      console.error('TTS API error:', errorMessage, data)
      return {
        success: false,
        error: errorMessage
      }
    }
    
  } catch (error) {
    console.error('Failed to generate TTS:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '语音合成服务异常'
    }
  }
}