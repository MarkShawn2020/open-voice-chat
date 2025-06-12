// 基于MediaPipe Tasks的现代人员检测实现

"use client"

import {
  PoseLandmarker,
  FaceLandmarker,
  HandLandmarker,
  FilesetResolver,
  DrawingUtils
} from "@mediapipe/tasks-vision"
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
  private poseLandmarker: PoseLandmarker | null = null
  private faceLandmarker: FaceLandmarker | null = null
  private handLandmarker: HandLandmarker | null = null
  private video: HTMLVideoElement | null = null
  private canvas: HTMLCanvasElement | null = null
  private canvasCtx: CanvasRenderingContext2D | null = null
  private config: PersonDetectionConfig
  private callbacks: PersonDetectionCallbacks
  private isRunning = false
  private animationFrameId: number | null = null
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

    // 创建canvas用于绘制
    this.createCanvas()
  }

  private createCanvas(): void {
    this.canvas = document.createElement('canvas')
    this.canvasCtx = this.canvas.getContext('2d')
    
    if (this.video) {
      this.canvas.width = this.video.videoWidth || 640
      this.canvas.height = this.video.videoHeight || 480
    }
  }

  private async initializeMediaPipe(): Promise<void> {
    try {
      console.log('Initializing MediaPipe Tasks...')
      
      // 初始化FilesetResolver
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      )

      // 并行创建三个检测器
      const [poseLandmarker, faceLandmarker, handLandmarker] = await Promise.all([
        // 创建姿态检测器
        PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numPoses: this.config.maxPersons,
          minPoseDetectionConfidence: this.config.minConfidence,
          minPosePresenceConfidence: this.config.minConfidence,
          minTrackingConfidence: this.config.minConfidence
        }),

        // 创建面部检测器
        FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numFaces: this.config.maxPersons,
          minFaceDetectionConfidence: this.config.minConfidence,
          minFacePresenceConfidence: this.config.minConfidence,
          minTrackingConfidence: this.config.minConfidence,
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false
        }),

        // 创建手部检测器
        HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: this.config.maxPersons * 2, // 每人最多2只手
          minHandDetectionConfidence: this.config.minConfidence,
          minHandPresenceConfidence: this.config.minConfidence,
          minTrackingConfidence: this.config.minConfidence
        })
      ])

      // 分配到实例变量
      this.poseLandmarker = poseLandmarker
      this.faceLandmarker = faceLandmarker
      this.handLandmarker = handLandmarker

      console.log('MediaPipe Tasks initialized successfully')
    } catch (error) {
      console.error('Failed to initialize MediaPipe Tasks:', error)
      this.callbacks.onError?.(error as Error)
    }
  }

  private async detect(): Promise<void> {
    if (!this.isRunning || !this.video || !this.poseLandmarker || !this.faceLandmarker || !this.handLandmarker) {
      return
    }

    const now = Date.now()
    if (now - this.lastDetectionTime < this.config.detectionInterval) {
      this.animationFrameId = requestAnimationFrame(() => this.detect())
      return
    }
    this.lastDetectionTime = now

    try {
      // 检测姿态
      const poseResults = this.poseLandmarker.detectForVideo(this.video, now)
      
      // 检测面部
      const faceResults = this.faceLandmarker.detectForVideo(this.video, now)
      
      // 检测手部
      const handResults = this.handLandmarker.detectForVideo(this.video, now)

      // 处理检测结果
      const detectionResult = this.processDetectionResults(poseResults, faceResults, handResults)
      
      console.log('Detection results:', {
        poses: poseResults.landmarks.length,
        faces: faceResults.faceLandmarks.length,
        hands: handResults.landmarks.length
      })

      this.updateStats(detectionResult)
      this.callbacks.onDetectionUpdate?.(detectionResult)

    } catch (error) {
      console.error('Detection error:', error)
      this.callbacks.onError?.(error as Error)
    }

    // 继续下一帧检测
    this.animationFrameId = requestAnimationFrame(() => this.detect())
  }

  private processDetectionResults(poseResults: any, faceResults: any, handResults: any): PersonDetectionResult {
    const persons: DetectedPerson[] = []
    
    // 基于姿态检测创建人员
    for (let i = 0; i < poseResults.landmarks.length; i++) {
      const poseLandmarks = poseResults.landmarks[i]
      
      // 尝试匹配对应的面部和手部
      const matchedFace = this.findMatchingFace(poseLandmarks, faceResults.faceLandmarks)
      const matchedHands = this.findMatchingHands(poseLandmarks, handResults.landmarks)
      
      const person = this.createPersonFromLandmarks(
        `person_${i}`,
        poseLandmarks,
        matchedFace,
        matchedHands
      )
      
      persons.push(person)
    }

    // 更新检测到的人员
    this.updateDetectedPersons(persons)

    return {
      persons: Array.from(this.detectedPersons.values()),
      totalCount: persons.length,
      timestamp: Date.now(),
      processingTime: 0
    }
  }

  private findMatchingFace(poseLandmarks: any[], faceLandmarks: any[]): any | null {
    if (!poseLandmarks || faceLandmarks.length === 0) return null
    
    // 使用鼻尖位置匹配最近的面部
    const noseLandmark = poseLandmarks[0] // 姿态中的鼻子位置
    if (!noseLandmark) return null

    let closestFace = null
    let minDistance = Infinity

    for (const face of faceLandmarks) {
      if (face && face.length > 0) {
        const faceNose = face[1] // 面部关键点中的鼻尖
        if (faceNose) {
          const distance = Math.sqrt(
            Math.pow(noseLandmark.x - faceNose.x, 2) +
            Math.pow(noseLandmark.y - faceNose.y, 2)
          )
          if (distance < minDistance) {
            minDistance = distance
            closestFace = face
          }
        }
      }
    }

    return minDistance < 0.1 ? closestFace : null // 阈值可调整
  }

  private findMatchingHands(poseLandmarks: any[], handLandmarks: any[]): any[] {
    if (!poseLandmarks || handLandmarks.length === 0) return []
    
    const leftWrist = poseLandmarks[15] // 左手腕
    const rightWrist = poseLandmarks[16] // 右手腕
    const matchedHands: any[] = []

    for (const hand of handLandmarks) {
      if (hand && hand.length > 0) {
        const handWrist = hand[0] // 手腕关键点
        
        if (leftWrist && handWrist) {
          const leftDistance = Math.sqrt(
            Math.pow(leftWrist.x - handWrist.x, 2) +
            Math.pow(leftWrist.y - handWrist.y, 2)
          )
          if (leftDistance < 0.1) {
            matchedHands.push({ hand, side: 'left' })
            continue
          }
        }
        
        if (rightWrist && handWrist) {
          const rightDistance = Math.sqrt(
            Math.pow(rightWrist.x - handWrist.x, 2) +
            Math.pow(rightWrist.y - handWrist.y, 2)
          )
          if (rightDistance < 0.1) {
            matchedHands.push({ hand, side: 'right' })
          }
        }
      }
    }

    return matchedHands
  }

  private createPersonFromLandmarks(
    personId: string,
    poseLandmarks: any[],
    faceLandmarks: any[] | null,
    handLandmarks: any[]
  ): DetectedPerson {
    const timestamp = Date.now()

    // 计算人员位置边界框
    const position = this.calculatePersonBounds(poseLandmarks)
    
    // 提取特征
    const features = this.extractFeatures(poseLandmarks, faceLandmarks, handLandmarks)
    
    // 分析运动
    const motion = this.analyzeMotion(personId, position, timestamp)
    
    // 分析状态
    const state = this.analyzePersonState(poseLandmarks, faceLandmarks, features)

    // 检测手势
    const gestureState = this.detectGestures(handLandmarks)

    const person: DetectedPerson = {
      id: personId,
      position,
      features,
      motion,
      state,
      confidence: this.calculateOverallConfidence(poseLandmarks, faceLandmarks, handLandmarks),
      timestamp,
      gestureState
    }

    return person
  }

  private calculatePersonBounds(poseLandmarks: any[]): PersonPosition {
    if (!poseLandmarks || poseLandmarks.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 }
    }

    let minX = 1, minY = 1, maxX = 0, maxY = 0

    poseLandmarks.forEach(landmark => {
      if (landmark && landmark.visibility > 0.5) {
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

  private extractFeatures(poseLandmarks: any[], faceLandmarks: any[] | null, handLandmarks: any[]): PersonFeatures {
    const features: PersonFeatures = {
      headDirection: 0,
      eyesDetected: false,
      faceVisibility: 0,
      bodyOrientation: 0,
      hasHands: handLandmarks.length > 0,
      handGestures: []
    }

    // 面部特征
    if (faceLandmarks && faceLandmarks.length > 0) {
      features.eyesDetected = this.detectEyes(faceLandmarks)
      features.faceVisibility = this.calculateFaceVisibility(faceLandmarks)
      features.headDirection = this.calculateHeadDirection(faceLandmarks)
    }

    // 身体朝向
    if (poseLandmarks) {
      features.bodyOrientation = this.calculateBodyOrientation(poseLandmarks)
    }

    // 手势分析
    if (handLandmarks.length > 0) {
      features.handGestures = this.analyzeHandGestures(handLandmarks)
    }

    return features
  }

  private detectEyes(faceLandmarks: any[]): boolean {
    // MediaPipe面部关键点索引
    const leftEyeIndices = [33, 7, 163, 144, 145, 153, 154, 155]
    const rightEyeIndices = [362, 382, 381, 380, 374, 373, 390, 249]

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

    let totalVisibility = 0
    let validPoints = 0

    faceLandmarks.forEach(landmark => {
      if (landmark && landmark.visibility !== undefined) {
        totalVisibility += landmark.visibility
        validPoints++
      }
    })

    return validPoints > 0 ? totalVisibility / validPoints : 0
  }

  private calculateHeadDirection(faceLandmarks: any[]): number {
    if (!faceLandmarks || faceLandmarks.length < 468) return 0

    const noseTip = faceLandmarks[1] // 鼻尖
    const leftEar = faceLandmarks[234] // 左耳轮廓
    const rightEar = faceLandmarks[454] // 右耳轮廓

    if (!noseTip || !leftEar || !rightEar) return 0

    const centerX = (leftEar.x + rightEar.x) / 2
    const deltaX = noseTip.x - centerX
    
    return deltaX * 90 // 转换为角度
  }

  private calculateBodyOrientation(poseLandmarks: any[]): number {
    if (!poseLandmarks || poseLandmarks.length < 33) return 0

    const leftShoulder = poseLandmarks[11]
    const rightShoulder = poseLandmarks[12]

    if (!leftShoulder || !rightShoulder) return 0

    const shoulderAngle = Math.atan2(
      rightShoulder.y - leftShoulder.y,
      rightShoulder.x - leftShoulder.x
    ) * (180 / Math.PI)

    return shoulderAngle
  }

  private analyzeHandGestures(handLandmarks: any[]): string[] {
    const gestures: string[] = []

    handLandmarks.forEach((handData, index) => {
      const hand = handData.hand || handData
      const side = handData.side || `hand_${index}`
      
      if (this.isPinchGesture(hand)) {
        gestures.push(`${side}_pinch`)
      }
      if (this.isPointingGesture(hand)) {
        gestures.push(`${side}_point`)
      }
      if (this.isThumbsUpGesture(hand)) {
        gestures.push(`${side}_thumbs_up`)
      }
    })

    return gestures
  }

  private isPinchGesture(landmarks: any[]): boolean {
    if (!landmarks || landmarks.length < 21) return false

    const thumbTip = landmarks[4]
    const indexTip = landmarks[8]

    if (!thumbTip || !indexTip) return false

    const distance = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) +
      Math.pow(thumbTip.y - indexTip.y, 2) +
      Math.pow((thumbTip.z || 0) - (indexTip.z || 0), 2)
    )

    return distance < 0.05
  }

  private isPointingGesture(landmarks: any[]): boolean {
    if (!landmarks || landmarks.length < 21) return false

    const indexMCP = landmarks[5]
    const indexTip = landmarks[8]
    const middleTip = landmarks[12]
    const ringTip = landmarks[16]
    const pinkyTip = landmarks[20]

    if (!indexMCP || !indexTip || !middleTip || !ringTip || !pinkyTip) return false

    const indexExtended = indexTip.y < indexMCP.y
    const othersBent = middleTip.y > indexMCP.y && ringTip.y > indexMCP.y && pinkyTip.y > indexMCP.y

    return indexExtended && othersBent
  }

  private isThumbsUpGesture(landmarks: any[]): boolean {
    if (!landmarks || landmarks.length < 21) return false

    const thumbTip = landmarks[4]
    const thumbMCP = landmarks[2]
    const indexMCP = landmarks[5]

    if (!thumbTip || !thumbMCP || !indexMCP) return false

    const thumbUp = thumbTip.y < thumbMCP.y
    const othersBent = landmarks[8].y > indexMCP.y

    return thumbUp && othersBent
  }

  private detectGestures(handLandmarks: any[]): GestureState {
    const gestureState: GestureState = {
      isPinching: false,
      isPointing: false,
      isWaving: false,
      isThumpsUp: false,
      confidence: 0
    }

    let gestureCount = 0
    let totalConfidence = 0

    for (const handData of handLandmarks) {
      const hand = handData.hand || handData
      
      if (this.isPinchGesture(hand)) {
        gestureState.isPinching = true
        totalConfidence += 0.9
        gestureCount++
      }
      
      if (this.isPointingGesture(hand)) {
        gestureState.isPointing = true
        totalConfidence += 0.8
        gestureCount++
      }
      
      if (this.isThumbsUpGesture(hand)) {
        gestureState.isThumpsUp = true
        totalConfidence += 0.85
        gestureCount++
      }
    }

    gestureState.confidence = gestureCount > 0 ? totalConfidence / gestureCount : 0
    return gestureState
  }

  private analyzeMotion(personId: string, position: PersonPosition, timestamp: number): PersonMotion {
    const history = this.motionHistory.get(personId) || {
      positions: [],
      maxHistoryLength: 10
    }

    history.positions.push({
      x: position.x + position.width / 2,
      y: position.y + position.height / 2,
      timestamp
    })

    if (history.positions.length > history.maxHistoryLength) {
      history.positions.shift()
    }

    this.motionHistory.set(personId, history)

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

  private analyzePersonState(poseLandmarks: any[], faceLandmarks: any[] | null, features: PersonFeatures): PersonState {
    return {
      isLookingAtCamera: this.isLookingAtCamera(features),
      isApproaching: false,
      isLeaving: false,
      isInteracting: features.hasHands,
      attentionLevel: this.calculateAttentionLevel(features),
      engagementScore: this.calculateEngagementScore(poseLandmarks, faceLandmarks, features)
    }
  }

  private isLookingAtCamera(features: PersonFeatures): boolean {
    const headDirectionScore = Math.abs(features.headDirection) <= 30 ? 1 : 0
    const eyeDetectionScore = features.eyesDetected ? 1 : 0
    const faceVisibilityScore = features.faceVisibility >= 0.7 ? 1 : 0

    const totalScore = (headDirectionScore + eyeDetectionScore + faceVisibilityScore) / 3
    return totalScore >= this.config.attentionSensitivity
  }

  private calculateAttentionLevel(features: PersonFeatures): number {
    let score = 0
    
    if (features.eyesDetected) score += 0.4
    if (features.faceVisibility > 0.7) score += 0.3
    if (Math.abs(features.headDirection) <= 30) score += 0.3
    
    return Math.min(1, score)
  }

  private calculateEngagementScore(poseLandmarks: any[], faceLandmarks: any[] | null, features: PersonFeatures): number {
    let score = 0
    
    if (features.eyesDetected) score += 0.25
    if (features.faceVisibility > 0.7) score += 0.25
    if (poseLandmarks && poseLandmarks.length > 0) score += 0.25
    if (features.hasHands) score += 0.25
    
    return score
  }

  private calculateOverallConfidence(poseLandmarks: any[], faceLandmarks: any[] | null, handLandmarks: any[]): number {
    let totalConfidence = 0
    let components = 0

    if (poseLandmarks && poseLandmarks.length > 0) {
      totalConfidence += 0.9
      components++
    }

    if (faceLandmarks && faceLandmarks.length > 0) {
      totalConfidence += 0.95
      components++
    }

    if (handLandmarks && handLandmarks.length > 0) {
      totalConfidence += 0.85
      components++
    }

    return components > 0 ? totalConfidence / components : 0
  }

  private updateDetectedPersons(newPersons: DetectedPerson[]): void {
    const currentPersonIds = new Set(newPersons.map(p => p.id))
    const previousPersonIds = new Set(this.detectedPersons.keys())

    for (const person of newPersons) {
      if (!previousPersonIds.has(person.id)) {
        this.callbacks.onPersonEntered?.(person)
      }
      this.detectedPersons.set(person.id, person)
    }

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

    await this.initializeMediaPipe()
    
    if (!this.video) {
      throw new Error('Video element not initialized')
    }

    if (!this.poseLandmarker || !this.faceLandmarker || !this.handLandmarker) {
      throw new Error('MediaPipe initialization timeout')
    }

    try {
      this.isRunning = true
      this.detect() // 开始检测循环
      console.log('Person detection started successfully')
      console.log('Video dimensions:', this.video.videoWidth, 'x', this.video.videoHeight)
    } catch (error) {
      console.error('Failed to start person detection:', error)
      this.callbacks.onError?.(error as Error)
      throw error
    }
  }

  public stop(): void {
    this.isRunning = false
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }

    this.detectedPersons.clear()
    this.motionHistory.clear()
    this.gestureHistory = []
    
    console.log('Person detection stopped')
  }

  public updateConfig(newConfig: Partial<PersonDetectionConfig>): void {
    this.config = { ...this.config, ...newConfig }
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