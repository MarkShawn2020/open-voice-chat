// 人员状态分析器 - 高级状态识别功能

import type {
  DetectedPerson,
  PersonState,
  PersonFeatures,
  PersonMotion,
  PersonPosition,
  MotionHistory
} from '@/types/person-detection'

export interface StateAnalysisConfig {
  // 注意力检测配置
  attentionConfig: {
    headDirectionThreshold: number // 头部朝向阈值 (度)
    eyeContactConfidence: number   // 眼神接触置信度阈值
    faceVisibilityThreshold: number // 面部可见度阈值
  }
  
  // 运动检测配置
  motionConfig: {
    approachingSpeedThreshold: number // 接近速度阈值
    leavingSpeedThreshold: number     // 离开速度阈值
    stationaryThreshold: number       // 静止阈值
    trackingHistoryFrames: number     // 运动历史帧数
  }
  
  // 交互检测配置
  interactionConfig: {
    gestureDetectionSensitivity: number // 手势检测敏感度
    headMovementThreshold: number       // 头部运动阈值
    bodyLanguageWeight: number          // 身体语言权重
  }
}

const DEFAULT_STATE_CONFIG: StateAnalysisConfig = {
  attentionConfig: {
    headDirectionThreshold: 30,
    eyeContactConfidence: 0.7,
    faceVisibilityThreshold: 0.6
  },
  motionConfig: {
    approachingSpeedThreshold: 2.0,
    leavingSpeedThreshold: -2.0,
    stationaryThreshold: 0.5,
    trackingHistoryFrames: 10
  },
  interactionConfig: {
    gestureDetectionSensitivity: 0.6,
    headMovementThreshold: 5.0,
    bodyLanguageWeight: 0.8
  }
}

export class PersonStateAnalyzer {
  private config: StateAnalysisConfig
  private motionHistories: Map<string, MotionHistory> = new Map()
  private previousStates: Map<string, PersonState> = new Map()
  private previousPositions: Map<string, PersonPosition[]> = new Map()
  
  constructor(config: Partial<StateAnalysisConfig> = {}) {
    this.config = this.mergeConfig(DEFAULT_STATE_CONFIG, config)
  }

  private mergeConfig(defaultConfig: StateAnalysisConfig, userConfig: Partial<StateAnalysisConfig>): StateAnalysisConfig {
    return {
      attentionConfig: { ...defaultConfig.attentionConfig, ...userConfig.attentionConfig },
      motionConfig: { ...defaultConfig.motionConfig, ...userConfig.motionConfig },
      interactionConfig: { ...defaultConfig.interactionConfig, ...userConfig.interactionConfig }
    }
  }

  public analyzePersonState(person: DetectedPerson, videoWidth: number, videoHeight: number): PersonState {
    // 更新运动历史
    this.updateMotionHistory(person)
    
    // 分析各个状态组件
    const isLookingAtCamera = this.analyzeLookingAtCamera(person.features, person.position, videoWidth, videoHeight)
    const motionAnalysis = this.analyzeMotion(person)
    const interactionAnalysis = this.analyzeInteraction(person)
    
    const state: PersonState = {
      isLookingAtCamera,
      isApproaching: motionAnalysis.isApproaching,
      isLeaving: motionAnalysis.isLeaving,
      isInteracting: interactionAnalysis.isInteracting,
      attentionLevel: this.calculateAttentionLevel(person, isLookingAtCamera),
      engagementScore: interactionAnalysis.confidence
    }
    
    // 保存当前状态
    this.previousStates.set(person.id, state)
    
    return state
  }

  private updateMotionHistory(person: DetectedPerson): void {
    const history = this.motionHistories.get(person.id) || {
      positions: [],
      maxHistoryLength: this.config.motionConfig.trackingHistoryFrames
    }
    
    // 添加当前位置
    history.positions.push({
      x: person.position.x + person.position.width / 2,
      y: person.position.y + person.position.height / 2,
      timestamp: person.timestamp
    })
    
    // 限制历史长度
    if (history.positions.length > history.maxHistoryLength) {
      history.positions.shift()
    }
    
    this.motionHistories.set(person.id, history)
  }

  private analyzeLookingAtCamera(features: PersonFeatures, position: PersonPosition, videoWidth: number, videoHeight: number): boolean {
    const config = this.config.attentionConfig
    
    // 检查头部朝向
    const headDirectionScore = Math.abs(features.headDirection) <= config.headDirectionThreshold ? 1 : 0
    
    // 检查眼睛检测
    const eyeContactScore = features.eyesDetected ? 1 : 0
    
    // 检查面部可见度
    const faceVisibilityScore = features.faceVisibility >= config.faceVisibilityThreshold ? 1 : 0
    
    // 检查人员是否面向屏幕中心
    const centerX = videoWidth / 2
    const centerY = videoHeight / 2
    const personCenterX = position.x + position.width / 2
    const personCenterY = position.y + position.height / 2
    
    const distanceFromCenter = Math.sqrt(
      Math.pow(personCenterX - centerX, 2) + Math.pow(personCenterY - centerY, 2)
    )
    const maxDistance = Math.sqrt(Math.pow(videoWidth / 2, 2) + Math.pow(videoHeight / 2, 2))
    const positionScore = 1 - (distanceFromCenter / maxDistance)
    
    // 综合评分
    const totalScore = (headDirectionScore * 0.4 + eyeContactScore * 0.3 + faceVisibilityScore * 0.2 + positionScore * 0.1)
    
    return totalScore >= 0.6
  }

  private analyzeMotion(person: DetectedPerson): { isApproaching: boolean; isLeaving: boolean } {
    const history = this.motionHistories.get(person.id)
    if (!history || history.positions.length < 3) {
      return { isApproaching: false, isLeaving: false }
    }
    
    const positions = history.positions
    const config = this.config.motionConfig
    
    // 计算平均运动向量
    let totalVelocityX = 0
    let totalVelocityY = 0
    let validVelocityCount = 0
    
    for (let i = 1; i < positions.length; i++) {
      const prev = positions[i - 1]
      const curr = positions[i]
      if (!prev || !curr) continue
      
      const deltaTime = (curr.timestamp - prev.timestamp) / 1000 // 转换为秒
      
      if (deltaTime > 0) {
        const velocityX = (curr.x - prev.x) / deltaTime
        const velocityY = (curr.y - prev.y) / deltaTime
        
        totalVelocityX += velocityX
        totalVelocityY += velocityY
        validVelocityCount++
      }
    }
    
    if (validVelocityCount === 0) {
      return { isApproaching: false, isLeaving: false }
    }
    
    const avgVelocityX = totalVelocityX / validVelocityCount
    const avgVelocityY = totalVelocityY / validVelocityCount
    const speed = Math.sqrt(avgVelocityX * avgVelocityX + avgVelocityY * avgVelocityY)
    
    // 计算人员大小变化来判断远近
    const firstPosition = positions[0]
    const lastPosition = positions[positions.length - 1]
    if (!firstPosition || !lastPosition) return { isApproaching: false, isLeaving: false }
    const sizeChange = this.calculateSizeFromPosition(lastPosition) - this.calculateSizeFromPosition(firstPosition)
    
    // 基于大小变化和运动速度判断接近/离开
    const isApproaching = sizeChange > 0 && speed >= config.approachingSpeedThreshold
    const isLeaving = sizeChange < 0 && speed >= Math.abs(config.leavingSpeedThreshold)
    
    return { isApproaching, isLeaving }
  }

  private calculateSizeFromPosition(position: { x: number; y: number }): number {
    // 简化实现：基于Y坐标估算大小（Y值越大，人物越靠下，可能越近）
    return position.y
  }

  private analyzeInteraction(person: DetectedPerson): { isInteracting: boolean; confidence: number } {
    const config = this.config.interactionConfig
    const history = this.motionHistories.get(person.id)
    const previousState = this.previousStates.get(person.id)
    
    let interactionScore = 0
    
    // 检查手势（基于运动模式）
    if (history && history.positions.length >= 3) {
      const gestureScore = this.detectGesture(history)
      interactionScore += gestureScore * 0.4
    }
    
    // 检查头部运动
    if (previousState) {
      const headMovementScore = this.analyzeHeadMovement(person, previousState)
      interactionScore += headMovementScore * 0.3
    }
    
    // 检查注意力持续时间
    const attentionScore = this.analyzeAttentionDuration(person.id)
    interactionScore += attentionScore * 0.3
    
    const isInteracting = interactionScore >= config.gestureDetectionSensitivity
    
    return {
      isInteracting,
      confidence: Math.min(1, interactionScore)
    }
  }

  private detectGesture(history: MotionHistory): number {
    const positions = history.positions
    if (positions.length < 5) return 0
    
    // 检测挥手等手势 - 寻找周期性运动
    let gestureScore = 0
    
    // 计算运动的变化率
    const velocities: number[] = []
    for (let i = 1; i < positions.length; i++) {
      const prev = positions[i - 1]
      const curr = positions[i]
      if (!prev || !curr) continue
      const velocity = Math.sqrt(
        Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
      )
      velocities.push(velocity)
    }
    
    // 检查速度变化的周期性（可能表示挥手）
    let directionChanges = 0
    for (let i = 1; i < velocities.length - 1; i++) {
      const prev = velocities[i - 1]
      const curr = velocities[i]
      const next = velocities[i + 1]
      
      if (prev !== undefined && curr !== undefined && next !== undefined && 
          ((curr > prev && curr > next) || (curr < prev && curr < next))) {
        directionChanges++
      }
    }
    
    // 如果有多次方向变化，可能是挥手手势
    if (directionChanges >= 2) {
      gestureScore = Math.min(1, directionChanges / 4)
    }
    
    return gestureScore
  }

  private analyzeHeadMovement(person: DetectedPerson, previousState: PersonState): number {
    // 简化的头部运动分析
    // 实际实现需要比较头部朝向的变化
    const config = this.config.interactionConfig
    
    // 如果人员从不注意摄像头变为注意摄像头，可能是交互开始
    if (!previousState.isLookingAtCamera && person.state.isLookingAtCamera) {
      return 0.8
    }
    
    // 检查头部朝向变化
    const headMovementScore = Math.abs(person.features.headDirection) > config.headMovementThreshold ? 0.6 : 0
    
    return headMovementScore
  }

  private analyzeAttentionDuration(personId: string): number {
    // 分析注意力持续时间
    // 实际实现需要跟踪注意力的历史记录
    return 0.5 // 简化实现
  }

  private calculateAttentionLevel(person: DetectedPerson, isLookingAtCamera: boolean): number {
    let attentionScore = 0
    
    // 基础注意力得分
    if (isLookingAtCamera) {
      attentionScore += 0.6
    }
    
    // 面部可见度加分
    attentionScore += person.features.faceVisibility * 0.2
    
    // 眼睛检测加分
    if (person.features.eyesDetected) {
      attentionScore += 0.2
    }
    
    return Math.min(1, attentionScore)
  }

  public updateConfig(newConfig: Partial<StateAnalysisConfig>): void {
    this.config = this.mergeConfig(this.config, newConfig)
  }

  public clearHistory(personId?: string): void {
    if (personId) {
      this.motionHistories.delete(personId)
      this.previousStates.delete(personId)
      this.previousPositions.delete(personId)
    } else {
      this.motionHistories.clear()
      this.previousStates.clear()
      this.previousPositions.clear()
    }
  }

  public getMotionHistory(personId: string): MotionHistory | undefined {
    return this.motionHistories.get(personId)
  }
}