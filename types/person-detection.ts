// 人员检测相关的类型定义

export interface PersonPosition {
  x: number
  y: number
  width: number
  height: number
}

export interface PersonFeatures {
  // 头部朝向 (角度，0度为正面)
  headDirection: number
  // 身体朝向
  bodyDirection: number
  // 眼睛检测
  eyesDetected: boolean
  // 面部可见度 (0-1)
  faceVisibility: number
  // 距离估算 (像素大小)
  estimatedDistance: number
}

export interface PersonMotion {
  // 移动方向向量
  velocityX: number
  velocityY: number
  // 移动速度
  speed: number
  // 是否在接近摄像头
  isApproaching: boolean
  // 是否在远离摄像头
  isLeaving: boolean
  // 是否静止
  isStationary: boolean
}

export interface PersonState {
  // 是否在注意摄像头 (基于头部朝向和眼睛检测)
  isLookingAtCamera: boolean
  // 是否正在走近
  isApproaching: boolean
  // 是否正在离开
  isLeaving: boolean
  // 是否正在与摄像头交互 (挥手、点头等)
  isInteracting: boolean
  // 注意力级别 (0-1)
  attentionLevel: number
  // 交互置信度 (0-1)
  interactionConfidence: number
}

export interface DetectedPerson {
  // 唯一标识符
  id: string
  // 检测时间戳
  timestamp: number
  // 位置信息
  position: PersonPosition
  // 特征信息
  features: PersonFeatures
  // 运动信息
  motion: PersonMotion
  // 状态信息
  state: PersonState
  // 检测置信度 (0-1)
  confidence: number
  // 连续跟踪帧数
  trackingFrames: number
}

export interface PersonDetectionResult {
  // 检测到的人员列表
  persons: DetectedPerson[]
  // 总人数
  totalCount: number
  // 检测时间戳
  timestamp: number
  // 帧率
  fps: number
  // 检测区域
  detectionArea: {
    width: number
    height: number
  }
}

export interface PersonDetectionConfig {
  // 检测间隔 (毫秒)
  detectionInterval: number
  // 最小检测置信度
  minConfidence: number
  // 最大跟踪人数
  maxPersons: number
  // 运动检测敏感度
  motionSensitivity: number
  // 注意力检测敏感度
  attentionSensitivity: number
  // 交互检测敏感度
  interactionSensitivity: number
  // 是否启用面部识别
  enableFaceRecognition: boolean
  // 是否启用姿态检测
  enablePoseDetection: boolean
}

export interface PersonDetectionCallbacks {
  // 新人员进入回调
  onPersonEntered?: (person: DetectedPerson) => void
  // 人员离开回调
  onPersonLeft?: (personId: string) => void
  // 人员状态变化回调
  onPersonStateChanged?: (person: DetectedPerson, previousState: PersonState) => void
  // 检测结果更新回调
  onDetectionUpdate?: (result: PersonDetectionResult) => void
  // 错误回调
  onError?: (error: Error) => void
}

// 运动历史记录，用于更准确的运动分析
export interface MotionHistory {
  positions: Array<{ x: number; y: number; timestamp: number }>
  maxHistoryLength: number
}

// 统计信息
export interface PersonDetectionStats {
  // 总检测人次
  totalDetections: number
  // 平均停留时间
  averageStayDuration: number
  // 最多同时在场人数
  maxSimultaneousPersons: number
  // 注意摄像头的人数统计
  lookingAtCameraCount: number
  // 交互人数统计
  interactingCount: number
}