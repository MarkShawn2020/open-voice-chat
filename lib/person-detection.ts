// 人员检测核心功能实现

import type {
  DetectedPerson,
  PersonDetectionResult,
  PersonDetectionConfig,
  PersonDetectionCallbacks,
  PersonPosition,
  PersonFeatures,
  PersonMotion,
  PersonState,
  MotionHistory,
  PersonDetectionStats
} from '@/types/person-detection'

// 默认配置
const DEFAULT_CONFIG: PersonDetectionConfig = {
  detectionInterval: 100, // 10 FPS
  minConfidence: 0.5,
  maxPersons: 10,
  motionSensitivity: 0.3,
  attentionSensitivity: 0.6,
  interactionSensitivity: 0.4,
  enableFaceRecognition: true,
  enablePoseDetection: true
}

export class PersonDetector {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private video: HTMLVideoElement | null = null
  private config: PersonDetectionConfig
  private callbacks: PersonDetectionCallbacks
  private isRunning = false
  private animationFrameId: number | null = null
  private lastDetectionTime = 0
  private detectedPersons: Map<string, DetectedPerson> = new Map()
  private motionHistory: Map<string, MotionHistory> = new Map()
  private stats: PersonDetectionStats = {
    totalDetections: 0,
    averageStayDuration: 0,
    maxSimultaneousPersons: 0,
    lookingAtCameraCount: 0,
    interactingCount: 0
  }

  constructor(
    video: HTMLVideoElement,
    config: Partial<PersonDetectionConfig> = {},
    callbacks: PersonDetectionCallbacks = {}
  ) {
    this.video = video
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.callbacks = callbacks
    
    // 创建离屏canvas用于图像处理
    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d')!
    
    // 设置canvas尺寸
    this.updateCanvasSize()
  }

  private updateCanvasSize() {
    if (this.video) {
      this.canvas.width = this.video.videoWidth || 640
      this.canvas.height = this.video.videoHeight || 480
    }
  }

  public start(): void {
    if (this.isRunning) return
    
    this.isRunning = true
    this.detectLoop()
  }

  public stop(): void {
    this.isRunning = false
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  private detectLoop = () => {
    if (!this.isRunning || !this.video) return

    const now = Date.now()
    if (now - this.lastDetectionTime >= this.config.detectionInterval) {
      this.performDetection()
      this.lastDetectionTime = now
    }

    this.animationFrameId = requestAnimationFrame(this.detectLoop)
  }

  private performDetection(): void {
    if (!this.video || this.video.readyState < 2) return

    try {
      // 更新canvas尺寸
      this.updateCanvasSize()
      
      // 绘制当前帧到canvas
      this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height)
      
      // 获取图像数据
      const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
      
      // 执行人员检测
      const detectionResult = this.detectPersons(imageData)
      
      // 更新跟踪状态
      this.updateTracking(detectionResult)
      
      // 触发回调
      this.callbacks.onDetectionUpdate?.(detectionResult)
      
    } catch (error) {
      console.error('Person detection error:', error)
      this.callbacks.onError?.(error as Error)
    }
  }

  private detectPersons(imageData: ImageData): PersonDetectionResult {
    // 基础的人员检测实现
    // 这里使用简化的运动检测和轮廓检测
    const persons: DetectedPerson[] = []
    
    // 使用基础的图像处理检测人形轮廓
    const detectedAreas = this.detectHumanShapes(imageData)
    
    detectedAreas.forEach((area, index) => {
      const person: DetectedPerson = {
        id: this.generatePersonId(area),
        timestamp: Date.now(),
        position: area,
        features: this.extractFeatures(imageData, area),
        motion: this.calculateMotion(area),
        state: this.analyzePersonState(area),
        confidence: this.calculateConfidence(area),
        trackingFrames: 1
      }
      
      persons.push(person)
    })

    return {
      persons,
      totalCount: persons.length,
      timestamp: Date.now(),
      fps: 1000 / this.config.detectionInterval,
      detectionArea: {
        width: this.canvas.width,
        height: this.canvas.height
      }
    }
  }

  private detectHumanShapes(imageData: ImageData): PersonPosition[] {
    // 简化的运动检测算法
    const shapes: PersonPosition[] = []
    const data = imageData.data
    const width = imageData.width
    const height = imageData.height
    
    // 基础的边缘检测和运动检测
    const motionPixels: Array<{x: number, y: number}> = []
    
    // 简单的像素差异检测 (实际应用中需要更复杂的算法)
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const i = (y * width + x) * 4
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3
        
        // 简单的边缘检测
        const rightI = (y * width + x + 1) * 4
        const bottomI = ((y + 1) * width + x) * 4
        const rightBrightness = (data[rightI] + data[rightI + 1] + data[rightI + 2]) / 3
        const bottomBrightness = (data[bottomI] + data[bottomI + 1] + data[bottomI + 2]) / 3
        
        const edgeStrength = Math.abs(brightness - rightBrightness) + Math.abs(brightness - bottomBrightness)
        
        if (edgeStrength > 30) { // 阈值
          motionPixels.push({x, y})
        }
      }
    }
    
    // 聚类检测到的像素点形成矩形区域
    const clusters = this.clusterPixels(motionPixels, width, height)
    
    clusters.forEach(cluster => {
      if (cluster.pixels.length > 100) { // 最小像素数阈值
        const bounds = this.calculateBounds(cluster.pixels)
        
        // 检查是否符合人形比例
        if (this.isHumanLikeShape(bounds)) {
          shapes.push(bounds)
        }
      }
    })
    
    return shapes
  }

  private clusterPixels(pixels: Array<{x: number, y: number}>, width: number, height: number) {
    const clusters: Array<{pixels: Array<{x: number, y: number}>}> = []
    const visited = new Set<string>()
    
    pixels.forEach(pixel => {
      const key = `${pixel.x},${pixel.y}`
      if (visited.has(key)) return
      
      const cluster = {pixels: [pixel]}
      const queue = [pixel]
      visited.add(key)
      
      while (queue.length > 0) {
        const current = queue.shift()!
        
        // 检查相邻像素
        for (let dy = -5; dy <= 5; dy++) {
          for (let dx = -5; dx <= 5; dx++) {
            const nx = current.x + dx
            const ny = current.y + dy
            const nkey = `${nx},${ny}`
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height && !visited.has(nkey)) {
              const neighbor = pixels.find(p => p.x === nx && p.y === ny)
              if (neighbor) {
                visited.add(nkey)
                cluster.pixels.push(neighbor)
                queue.push(neighbor)
              }
            }
          }
        }
      }
      
      clusters.push(cluster)
    })
    
    return clusters
  }

  private calculateBounds(pixels: Array<{x: number, y: number}>): PersonPosition {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    
    pixels.forEach(pixel => {
      minX = Math.min(minX, pixel.x)
      minY = Math.min(minY, pixel.y)
      maxX = Math.max(maxX, pixel.x)
      maxY = Math.max(maxY, pixel.y)
    })
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    }
  }

  private isHumanLikeShape(bounds: PersonPosition): boolean {
    const aspectRatio = bounds.height / bounds.width
    // 人形的典型高宽比在1.5到3之间
    return aspectRatio >= 1.5 && aspectRatio <= 3 && bounds.height > 50 && bounds.width > 20
  }

  private generatePersonId(position: PersonPosition): string {
    // 基于位置和时间生成唯一ID
    return `person_${position.x}_${position.y}_${Date.now()}`
  }

  private extractFeatures(imageData: ImageData, position: PersonPosition): PersonFeatures {
    // 提取人员特征 (简化实现)
    const centerX = position.x + position.width / 2
    const centerY = position.y + position.height / 2
    
    // 估算头部区域 (通常在上1/4区域)
    const headArea = {
      x: position.x,
      y: position.y,
      width: position.width,
      height: position.height / 4
    }
    
    return {
      headDirection: this.estimateHeadDirection(imageData, headArea),
      bodyDirection: 0, // 简化
      eyesDetected: this.detectEyes(imageData, headArea),
      faceVisibility: this.calculateFaceVisibility(imageData, headArea),
      estimatedDistance: this.estimateDistance(position)
    }
  }

  private estimateHeadDirection(imageData: ImageData, headArea: PersonPosition): number {
    // 简化的头部朝向估算
    // 实际实现需要使用更复杂的面部关键点检测
    return 0 // 默认正面
  }

  private detectEyes(imageData: ImageData, headArea: PersonPosition): boolean {
    // 简化的眼睛检测
    // 实际实现需要使用专门的眼睛检测算法
    return Math.random() > 0.5 // 随机结果，实际需要真实检测
  }

  private calculateFaceVisibility(imageData: ImageData, headArea: PersonPosition): number {
    // 简化的面部可见度计算
    return Math.min(1, headArea.width * headArea.height / 1000)
  }

  private estimateDistance(position: PersonPosition): number {
    // 基于人形大小估算距离
    const assumedHumanHeight = 170 // cm
    const focalLength = 500 // 简化的焦距
    return (assumedHumanHeight * focalLength) / position.height
  }

  private calculateMotion(position: PersonPosition): PersonMotion {
    // 计算运动信息 (需要历史数据)
    return {
      velocityX: 0,
      velocityY: 0,
      speed: 0,
      isApproaching: false,
      isLeaving: false,
      isStationary: true
    }
  }

  private analyzePersonState(position: PersonPosition): PersonState {
    // 分析人员状态
    return {
      isLookingAtCamera: Math.random() > 0.7, // 简化
      isApproaching: false,
      isLeaving: false,
      isInteracting: false,
      attentionLevel: Math.random(),
      interactionConfidence: 0
    }
  }

  private calculateConfidence(position: PersonPosition): number {
    // 基于检测质量计算置信度
    const sizeScore = Math.min(1, (position.width * position.height) / 10000)
    const shapeScore = this.isHumanLikeShape(position) ? 0.8 : 0.3
    return (sizeScore + shapeScore) / 2
  }

  private updateTracking(result: PersonDetectionResult): void {
    // 更新跟踪状态和统计信息
    this.stats.totalDetections += result.totalCount
    this.stats.maxSimultaneousPersons = Math.max(this.stats.maxSimultaneousPersons, result.totalCount)
    
    // 统计注意摄像头和交互的人数
    let lookingCount = 0
    let interactingCount = 0
    
    result.persons.forEach(person => {
      if (person.state.isLookingAtCamera) lookingCount++
      if (person.state.isInteracting) interactingCount++
    })
    
    this.stats.lookingAtCameraCount = lookingCount
    this.stats.interactingCount = interactingCount
  }

  public getStats(): PersonDetectionStats {
    return { ...this.stats }
  }

  public getDetectedPersons(): DetectedPerson[] {
    return Array.from(this.detectedPersons.values())
  }

  public updateConfig(newConfig: Partial<PersonDetectionConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }
}