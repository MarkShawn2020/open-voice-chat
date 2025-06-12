// 基于MediaPipe Holistic的人员检测核心功能实现

import type { Results } from '@mediapipe/holistic'
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

// 手势检测类型
export interface GestureState {
  isPinching: boolean // 捏合手势
  isPointing: boolean // 指向手势
  isWaving: boolean // 挥手手势
  isThumpsUp: boolean // 竖大拇指
  confidence: number
}

export class PersonDetector {
  private holistic: any = null
  private camera: any = null
  private video: HTMLVideoElement | null = null
  private config: PersonDetectionConfig
  private callbacks: PersonDetectionCallbacks
  private isRunning = false
  private detectedPersons: Map<string, DetectedPerson> = new Map()
  private motionHistory: Map<string, MotionHistory> = new Map()
  private stats: PersonDetectionStats = {
    totalDetections: 0,
    averageStayDuration: 0,
    maxSimultaneousPersons: 0,
    lookingAtCameraCount: 0,
    interactingCount: 0
  }
  private lastDetectionTime = 0
  private gestureHistory: Array<{ timestamp: number; hands: any[] }> = []

  constructor(
    video: HTMLVideoElement,
    config: Partial<PersonDetectionConfig> = {},
    callbacks: PersonDetectionCallbacks = {}
  ) {
    this.video = video
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.callbacks = {
      onDetectionUpdate: callbacks.onDetectionUpdate || (() => {}),
      onPersonEntered: callbacks.onPersonEntered || (() => {}),
      onPersonLeft: callbacks.onPersonLeft || (() => {}),
      onError: callbacks.onError || (() => {})
    }

    // 延迟初始化MediaPipe，避免阻塞构造函数
    setTimeout(() => {
      this.initializeMediaPipe()
    }, 100)
  }

  private async initializeMediaPipe(): Promise<void> {
    try {
      // 在浏览器环境中，MediaPipe通过全局变量暴露
      const holisticModule = await import('@mediapipe/holistic')
      
      // 获取Holistic构造函数
      const HolisticClass = (holisticModule as any).Holistic || (window as any).Holistic
      
      if (!HolisticClass) {
        // 如果导入失败，尝试通过CDN加载
        await this.loadMediaPipeFromCDN()
        return
      }
      
      // 初始化Holistic模型
      this.holistic = new HolisticClass({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`
      })

      // 配置Holistic选项
      this.holistic.setOptions({
        modelComplexity: 1, // 0-2，复杂度越高精度越高但速度越慢
        smoothLandmarks: true,
        enableSegmentation: false, // 是否启用人体分割
        smoothSegmentation: true,
        refineFaceLandmarks: true, // 精细面部特征点
        minDetectionConfidence: this.config.minConfidence,
        minTrackingConfidence: this.config.minConfidence
      })

      // 设置结果回调
      this.holistic.onResults(this.onResults.bind(this))

      console.log('MediaPipe Holistic initialized successfully')
    } catch (error) {
      console.error('Failed to initialize MediaPipe:', error)
      this.callbacks.onError?.(error as Error)
    }
  }

  private async loadMediaPipeFromCDN(): Promise<void> {
    try {
      // 通过CDN加载MediaPipe脚本
      await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js')
      await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js')
      await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js')
      await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/holistic/holistic.js')

      // 等待脚本加载完成
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 从全局变量获取Holistic
      const HolisticClass = (window as any).Holistic
      
      if (!HolisticClass) {
        throw new Error('Failed to load Holistic from CDN')
      }

      // 初始化Holistic模型
      this.holistic = new HolisticClass({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`
      })

      // 配置选项
      this.holistic.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: true,
        refineFaceLandmarks: true,
        minDetectionConfidence: this.config.minConfidence,
        minTrackingConfidence: this.config.minConfidence
      })

      // 设置结果回调
      this.holistic.onResults(this.onResults.bind(this))

      console.log('MediaPipe Holistic loaded from CDN successfully')
    } catch (error) {
      console.error('Failed to load MediaPipe from CDN:', error)
      this.callbacks.onError?.(error as Error)
    }
  }

  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // 检查脚本是否已加载
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve()
        return
      }

      const script = document.createElement('script')
      script.src = src
      script.onload = () => resolve()
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
      document.head.appendChild(script)
    })
  }

  private onResults(results: Results): void {
    if (!this.isRunning) return

    const now = Date.now()
    if (now - this.lastDetectionTime < this.config.detectionInterval) {
      return
    }
    this.lastDetectionTime = now

    try {
      const detectionResult = this.processHolisticResults(results)
      this.updateStats(detectionResult)
      this.callbacks.onDetectionUpdate?.(detectionResult)
    } catch (error) {
      console.error('Error processing detection results:', error)
      this.callbacks.onError?.(error as Error)
    }
  }

  private processHolisticResults(results: Results): PersonDetectionResult {
    const persons: DetectedPerson[] = []
    
    // 如果检测到姿态，说明有人存在
    if (results.poseLandmarks && results.poseLandmarks.length > 0) {
      const person = this.createPersonFromResults(results)
      persons.push(person)
    }

    // 更新检测到的人员
    this.updateDetectedPersons(persons)

    return {
      persons: Array.from(this.detectedPersons.values()),
      totalCount: persons.length,
      timestamp: Date.now(),
      processingTime: 0 // MediaPipe处理时间
    }
  }

  private createPersonFromResults(results: Results): DetectedPerson {
    const personId = 'person_main' // 当前版本只支持单人检测
    const timestamp = Date.now()

    // 计算人员位置边界框
    const position = this.calculatePersonBounds(results.poseLandmarks!)
    
    // 提取特征
    const features = this.extractFeatures(results)
    
    // 分析运动
    const motion = this.analyzeMotion(personId, position, timestamp)
    
    // 分析状态
    const state = this.analyzePersonState(results, features)

    // 检测手势
    const gestureState = this.detectGestures(results)

    const person: DetectedPerson = {
      id: personId,
      position,
      features,
      motion,
      state,
      confidence: this.calculateOverallConfidence(results),
      timestamp,
      gestureState // 添加手势状态
    }

    return person
  }

  private calculatePersonBounds(poseLandmarks: any[]): PersonPosition {
    if (!poseLandmarks || poseLandmarks.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 }
    }

    // 计算所有关键点的边界框
    let minX = 1, minY = 1, maxX = 0, maxY = 0

    poseLandmarks.forEach(landmark => {
      if (landmark.visibility > 0.5) { // 只考虑可见的关键点
        minX = Math.min(minX, landmark.x)
        minY = Math.min(minY, landmark.y)
        maxX = Math.max(maxX, landmark.x)
        maxY = Math.max(maxY, landmark.y)
      }
    })

    const videoWidth = this.video?.videoWidth || 640
    const videoHeight = this.video?.videoHeight || 480

    return {
      x: minX * videoWidth,
      y: minY * videoHeight,
      width: (maxX - minX) * videoWidth,
      height: (maxY - minY) * videoHeight
    }
  }

  private extractFeatures(results: Results): PersonFeatures {
    const features: PersonFeatures = {
      headDirection: 0,
      eyesDetected: false,
      faceVisibility: 0,
      bodyOrientation: 0,
      hasHands: false,
      handGestures: []
    }

    // 面部特征
    if (results.faceLandmarks && results.faceLandmarks.length > 0) {
      features.eyesDetected = this.detectEyes(results.faceLandmarks)
      features.faceVisibility = this.calculateFaceVisibility(results.faceLandmarks)
      features.headDirection = this.calculateHeadDirection(results.faceLandmarks)
    }

    // 身体朝向
    if (results.poseLandmarks) {
      features.bodyOrientation = this.calculateBodyOrientation(results.poseLandmarks)
    }

    // 手部特征
    if (results.rightHandLandmarks || results.leftHandLandmarks) {
      features.hasHands = true
      features.handGestures = this.analyzeHandGestures(results)
    }

    return features
  }

  private detectEyes(faceLandmarks: any[]): boolean {
    // MediaPipe面部关键点中，眼睛区域的索引
    const leftEyeIndices = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]
    const rightEyeIndices = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398]

    // 检查眼睛关键点的可见性
    const leftEyeVisible = leftEyeIndices.some(i => 
      faceLandmarks[i] && faceLandmarks[i].visibility > 0.7
    )
    const rightEyeVisible = rightEyeIndices.some(i => 
      faceLandmarks[i] && faceLandmarks[i].visibility > 0.7
    )

    return leftEyeVisible || rightEyeVisible
  }

  private calculateFaceVisibility(faceLandmarks: any[]): number {
    if (!faceLandmarks || faceLandmarks.length === 0) return 0

    // 计算关键面部特征点的平均可见性
    const keyIndices = [10, 151, 9, 8, 168, 6, 197, 195, 5, 4, 1, 2, 164, 0, 11, 12, 13, 14, 15, 16, 17, 18, 200, 199, 175, 0]
    
    let totalVisibility = 0
    let validPoints = 0

    keyIndices.forEach(index => {
      if (faceLandmarks[index] && faceLandmarks[index].visibility !== undefined) {
        totalVisibility += faceLandmarks[index].visibility
        validPoints++
      }
    })

    return validPoints > 0 ? totalVisibility / validPoints : 0
  }

  private calculateHeadDirection(faceLandmarks: any[]): number {
    if (!faceLandmarks || faceLandmarks.length < 468) return 0

    // 使用鼻尖和面部中心计算头部朝向
    const noseTip = faceLandmarks[1] // 鼻尖
    const leftEar = faceLandmarks[234] // 左耳
    const rightEar = faceLandmarks[454] // 右耳

    if (!noseTip || !leftEar || !rightEar) return 0

    // 计算左右耳朵的中点（面部中心）
    const centerX = (leftEar.x + rightEar.x) / 2
    const centerY = (leftEar.y + rightEar.y) / 2

    // 计算鼻尖相对于面部中心的角度
    const deltaX = noseTip.x - centerX
    const deltaY = noseTip.y - centerY

    // 转换为角度（度）
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI)
    
    // 归一化到-90到90度范围
    return Math.max(-90, Math.min(90, angle))
  }

  private calculateBodyOrientation(poseLandmarks: any[]): number {
    if (!poseLandmarks || poseLandmarks.length < 33) return 0

    // 使用肩膀和胯部关键点计算身体朝向
    const leftShoulder = poseLandmarks[11] // 左肩
    const rightShoulder = poseLandmarks[12] // 右肩
    const leftHip = poseLandmarks[23] // 左胯
    const rightHip = poseLandmarks[24] // 右胯

    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return 0

    // 计算肩膀和胯部的中心点
    const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2
    const hipCenterX = (leftHip.x + rightHip.x) / 2

    // 计算身体的朝向角度
    const bodyAngle = Math.atan2(
      shoulderCenterX - hipCenterX,
      leftShoulder.y - leftHip.y
    ) * (180 / Math.PI)

    return bodyAngle
  }

  private analyzeHandGestures(results: Results): string[] {
    const gestures: string[] = []

    // 分析右手手势
    if (results.rightHandLandmarks) {
      const rightGestures = this.detectHandGestures(results.rightHandLandmarks, 'right')
      gestures.push(...rightGestures)
    }

    // 分析左手手势
    if (results.leftHandLandmarks) {
      const leftGestures = this.detectHandGestures(results.leftHandLandmarks, 'left')
      gestures.push(...leftGestures)
    }

    return gestures
  }

  private detectHandGestures(handLandmarks: any[], hand: 'left' | 'right'): string[] {
    const gestures: string[] = []

    // 检测基本手势
    if (this.isPinchGesture(handLandmarks)) {
      gestures.push(`${hand}_pinch`)
    }

    if (this.isPointingGesture(handLandmarks)) {
      gestures.push(`${hand}_point`)
    }

    if (this.isThumbsUpGesture(handLandmarks)) {
      gestures.push(`${hand}_thumbs_up`)
    }

    if (this.isOpenPalmGesture(handLandmarks)) {
      gestures.push(`${hand}_open_palm`)
    }

    return gestures
  }

  private isPinchGesture(landmarks: any[]): boolean {
    if (!landmarks || landmarks.length < 21) return false

    // 拇指指尖和食指指尖的位置
    const thumbTip = landmarks[4]  // 拇指指尖
    const indexTip = landmarks[8]  // 食指指尖

    if (!thumbTip || !indexTip) return false

    // 计算两个指尖之间的距离
    const distance = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) +
      Math.pow(thumbTip.y - indexTip.y, 2) +
      Math.pow(thumbTip.z - indexTip.z, 2)
    )

    // 如果距离小于阈值，认为是捏合手势
    return distance < 0.05 // 根据实际情况调整阈值
  }

  private isPointingGesture(landmarks: any[]): boolean {
    if (!landmarks || landmarks.length < 21) return false

    // 检查食指是否伸直，其他手指是否弯曲
    const indexMCP = landmarks[5]   // 食指根部
    const indexPIP = landmarks[6]   // 食指第一关节
    const indexDIP = landmarks[7]   // 食指第二关节
    const indexTip = landmarks[8]   // 食指指尖

    const middleTip = landmarks[12] // 中指指尖
    const ringTip = landmarks[16]   // 无名指指尖
    const pinkyTip = landmarks[20]  // 小指指尖

    if (!indexMCP || !indexPIP || !indexDIP || !indexTip || !middleTip || !ringTip || !pinkyTip) {
      return false
    }

    // 检查食指是否伸直（y坐标递减）
    const indexStraight = indexTip.y < indexDIP.y && indexDIP.y < indexPIP.y && indexPIP.y < indexMCP.y

    // 检查其他手指是否弯曲（指尖位置高于手掌）
    const otherFingersBent = middleTip.y > indexMCP.y && ringTip.y > indexMCP.y && pinkyTip.y > indexMCP.y

    return indexStraight && otherFingersBent
  }

  private isThumbsUpGesture(landmarks: any[]): boolean {
    if (!landmarks || landmarks.length < 21) return false

    const thumbTip = landmarks[4]   // 拇指指尖
    const thumbIP = landmarks[3]    // 拇指关节
    const thumbMCP = landmarks[2]   // 拇指根部
    const indexMCP = landmarks[5]   // 食指根部

    if (!thumbTip || !thumbIP || !thumbMCP || !indexMCP) return false

    // 检查拇指是否向上伸直
    const thumbUp = thumbTip.y < thumbIP.y && thumbIP.y < thumbMCP.y

    // 检查其他手指是否弯曲
    const otherFingersBent = landmarks[8].y > indexMCP.y && // 食指
                            landmarks[12].y > landmarks[9].y && // 中指
                            landmarks[16].y > landmarks[13].y && // 无名指
                            landmarks[20].y > landmarks[17].y    // 小指

    return thumbUp && otherFingersBent
  }

  private isOpenPalmGesture(landmarks: any[]): boolean {
    if (!landmarks || landmarks.length < 21) return false

    // 检查所有手指是否都伸直
    const fingersExtended = [
      landmarks[8].y < landmarks[6].y,   // 食指
      landmarks[12].y < landmarks[10].y, // 中指
      landmarks[16].y < landmarks[14].y, // 无名指
      landmarks[20].y < landmarks[18].y  // 小指
    ]

    const thumbExtended = landmarks[4].x > landmarks[3].x // 拇指横向伸展

    return fingersExtended.every(extended => extended) && thumbExtended
  }

  private detectGestures(results: Results): GestureState {
    const gestureState: GestureState = {
      isPinching: false,
      isPointing: false,
      isWaving: false,
      isThumpsUp: false,
      confidence: 0
    }

    let totalConfidence = 0
    let gestureCount = 0

    // 检测捏合手势
    if (results.rightHandLandmarks && this.isPinchGesture(results.rightHandLandmarks) ||
        results.leftHandLandmarks && this.isPinchGesture(results.leftHandLandmarks)) {
      gestureState.isPinching = true
      totalConfidence += 0.9
      gestureCount++
    }

    // 检测指向手势
    if (results.rightHandLandmarks && this.isPointingGesture(results.rightHandLandmarks) ||
        results.leftHandLandmarks && this.isPointingGesture(results.leftHandLandmarks)) {
      gestureState.isPointing = true
      totalConfidence += 0.8
      gestureCount++
    }

    // 检测竖大拇指
    if (results.rightHandLandmarks && this.isThumbsUpGesture(results.rightHandLandmarks) ||
        results.leftHandLandmarks && this.isThumbsUpGesture(results.leftHandLandmarks)) {
      gestureState.isThumpsUp = true
      totalConfidence += 0.85
      gestureCount++
    }

    // 检测挥手手势（需要时间序列数据）
    gestureState.isWaving = this.detectWavingGesture(results)
    if (gestureState.isWaving) {
      totalConfidence += 0.75
      gestureCount++
    }

    gestureState.confidence = gestureCount > 0 ? totalConfidence / gestureCount : 0

    return gestureState
  }

  private detectWavingGesture(results: Results): boolean {
    // 将当前手部数据添加到历史记录
    this.gestureHistory.push({
      timestamp: Date.now(),
      hands: [results.rightHandLandmarks, results.leftHandLandmarks].filter(Boolean)
    })

    // 保留最近1秒的数据
    const oneSecondAgo = Date.now() - 1000
    this.gestureHistory = this.gestureHistory.filter(entry => entry.timestamp > oneSecondAgo)

    if (this.gestureHistory.length < 10) return false // 需要足够的历史数据

    // 分析手腕的水平运动模式
    const wristMovements: number[] = []
    
    for (let i = 1; i < this.gestureHistory.length; i++) {
      const prev = this.gestureHistory[i - 1]
      const curr = this.gestureHistory[i]
      
      if (prev?.hands && prev.hands.length > 0 && curr?.hands && curr.hands.length > 0) {
        const prevWrist = prev.hands[0]?.[0] // 手腕关键点
        const currWrist = curr.hands[0]?.[0]
        
        if (prevWrist && currWrist) {
          const movement = currWrist.x - prevWrist.x
          wristMovements.push(movement)
        }
      }
    }

    if (wristMovements.length < 5) return false

    // 检查是否有交替的左右运动
    let directionChanges = 0
    for (let i = 1; i < wristMovements.length; i++) {
      const current = wristMovements[i]
      const previous = wristMovements[i-1]
      if (current !== undefined && previous !== undefined &&
          ((current > 0 && previous < 0) || (current < 0 && previous > 0))) {
        directionChanges++
      }
    }

    // 如果有多次方向变化，可能是挥手
    return directionChanges >= 3
  }

  private analyzeMotion(personId: string, position: PersonPosition, timestamp: number): PersonMotion {
    const history = this.motionHistory.get(personId) || {
      positions: [],
      maxHistoryLength: 10
    }

    // 添加当前位置
    history.positions.push({
      x: position.x + position.width / 2,
      y: position.y + position.height / 2,
      timestamp
    })

    // 限制历史长度
    if (history.positions.length > history.maxHistoryLength) {
      history.positions.shift()
    }

    this.motionHistory.set(personId, history)

    // 计算运动参数
    let velocity = 0
    let direction = 0

    if (history.positions.length >= 2) {
      const current = history.positions[history.positions.length - 1]
      const previous = history.positions[history.positions.length - 2]
      
      if (current && previous) {
        const deltaTime = (current.timestamp - previous.timestamp) / 1000
        const deltaX = current.x - previous.x
        const deltaY = current.y - previous.y
        
        velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / deltaTime
        direction = Math.atan2(deltaY, deltaX) * (180 / Math.PI)
      }
    }

    return {
      velocity,
      direction,
      isStationary: velocity < this.config.motionSensitivity
    }
  }

  private analyzePersonState(results: Results, features: PersonFeatures): PersonState {
    return {
      isLookingAtCamera: this.isLookingAtCamera(features),
      isApproaching: false, // 需要更复杂的逻辑
      isLeaving: false,
      isInteracting: this.isInteracting(results),
      attentionLevel: this.calculateAttentionLevel(features),
      engagementScore: this.calculateEngagementScore(results, features)
    }
  }

  private isLookingAtCamera(features: PersonFeatures): boolean {
    // 基于头部朝向和眼睛检测判断是否看向摄像头
    const headDirectionScore = Math.abs(features.headDirection) <= 30 ? 1 : 0
    const eyeDetectionScore = features.eyesDetected ? 1 : 0
    const faceVisibilityScore = features.faceVisibility >= 0.7 ? 1 : 0

    const totalScore = (headDirectionScore + eyeDetectionScore + faceVisibilityScore) / 3
    return totalScore >= this.config.attentionSensitivity
  }

  private isInteracting(results: Results): boolean {
    // 检查是否有手势或明显的身体运动
    const hasHandGestures = (results.rightHandLandmarks && results.rightHandLandmarks.length > 0) ||
                           (results.leftHandLandmarks && results.leftHandLandmarks.length > 0)
    
    // 可以添加更多交互检测逻辑
    return hasHandGestures
  }

  private calculateAttentionLevel(features: PersonFeatures): number {
    let score = 0
    
    if (features.eyesDetected) score += 0.4
    if (features.faceVisibility > 0.7) score += 0.3
    if (Math.abs(features.headDirection) <= 30) score += 0.3
    
    return Math.min(1, score)
  }

  private calculateEngagementScore(results: Results, features: PersonFeatures): number {
    let score = 0
    
    // 面部参与度
    if (features.eyesDetected) score += 0.25
    if (features.faceVisibility > 0.7) score += 0.25
    
    // 身体参与度
    if (results.poseLandmarks) score += 0.25
    
    // 手部参与度
    if (features.hasHands) score += 0.25
    
    return score
  }

  private calculateOverallConfidence(results: Results): number {
    let totalConfidence = 0
    let components = 0

    // 姿态置信度
    if (results.poseLandmarks) {
      const poseConfidence = results.poseLandmarks
        .filter(landmark => (landmark.visibility ?? 0) > 0.5)
        .reduce((sum, landmark) => sum + (landmark.visibility ?? 0), 0) / results.poseLandmarks.length
      totalConfidence += poseConfidence
      components++
    }

    // 面部置信度
    if (results.faceLandmarks) {
      totalConfidence += 0.9 // MediaPipe面部检测通常置信度较高
      components++
    }

    // 手部置信度
    if (results.rightHandLandmarks || results.leftHandLandmarks) {
      totalConfidence += 0.85
      components++
    }

    return components > 0 ? totalConfidence / components : 0
  }

  private updateDetectedPersons(newPersons: DetectedPerson[]): void {
    const currentPersonIds = new Set(newPersons.map(p => p.id))
    const previousPersonIds = new Set(this.detectedPersons.keys())

    // 检查新进入的人员
    for (const person of newPersons) {
      if (!previousPersonIds.has(person.id)) {
        this.callbacks.onPersonEntered?.(person)
      }
      this.detectedPersons.set(person.id, person)
    }

    // 检查离开的人员
    for (const personId of Array.from(previousPersonIds)) {
      if (!currentPersonIds.has(personId)) {
        this.callbacks.onPersonLeft?.(personId)
        this.detectedPersons.delete(personId)
        this.motionHistory.delete(personId)
      }
    }
  }

  private updateStats(result: PersonDetectionResult): void {
    this.stats.totalDetections++
    this.stats.maxSimultaneousPersons = Math.max(
      this.stats.maxSimultaneousPersons,
      result.totalCount
    )

    // 统计注意力和交互状态
    let lookingCount = 0
    let interactingCount = 0

    for (const person of result.persons) {
      if (person.state.isLookingAtCamera) lookingCount++
      if (person.state.isInteracting) interactingCount++
    }

    this.stats.lookingAtCameraCount = lookingCount
    this.stats.interactingCount = interactingCount
  }

  // 公共方法
  public async start(): Promise<void> {
    if (!this.video) {
      throw new Error('Video element not initialized')
    }

    // 等待MediaPipe初始化
    let attempts = 0
    while (!this.holistic && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100))
      attempts++
    }

    if (!this.holistic) {
      throw new Error('MediaPipe initialization timeout')
    }

    try {
      // 尝试从多个来源获取Camera类
      let CameraClass
      
      try {
        const cameraModule = await import('@mediapipe/camera_utils')
        CameraClass = (cameraModule as any).Camera
      } catch {
        // 如果模块导入失败，尝试从全局变量获取
        CameraClass = (window as any).Camera
      }
      
      if (!CameraClass) {
        throw new Error('Camera class not available')
      }
      
      // 初始化摄像头
      this.camera = new CameraClass(this.video, {
        onFrame: async () => {
          if (this.holistic && this.isRunning) {
            await this.holistic.send({ image: this.video! })
          }
        },
        width: this.video.videoWidth || 640,
        height: this.video.videoHeight || 480
      })

      await this.camera.start()
      this.isRunning = true
      console.log('Person detection started')
    } catch (error) {
      console.error('Failed to start person detection:', error)
      this.callbacks.onError?.(error as Error)
      throw error
    }
  }

  public stop(): void {
    this.isRunning = false
    
    if (this.camera) {
      this.camera.stop()
      this.camera = null
    }

    this.detectedPersons.clear()
    this.motionHistory.clear()
    this.gestureHistory = []
    
    console.log('Person detection stopped')
  }

  public updateConfig(newConfig: Partial<PersonDetectionConfig>): void {
    this.config = { ...this.config, ...newConfig }
    
    // 更新MediaPipe设置
    if (this.holistic) {
      this.holistic.setOptions({
        minDetectionConfidence: this.config.minConfidence,
        minTrackingConfidence: this.config.minConfidence
      })
    }
  }

  public getStats(): PersonDetectionStats {
    return { ...this.stats }
  }

  public getDetectedPersons(): DetectedPerson[] {
    return Array.from(this.detectedPersons.values())
  }

  public isDetectionRunning(): boolean {
    return this.isRunning
  }
}