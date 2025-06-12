"use client"

import { PersonDetectionOverlay } from "./person-detection-overlay"
import { PersonDetectionPanel } from "./person-detection-panel"
import type {
  PersonDetectionConfig,
  PersonDetectionResult,
  PersonDetectionStats,
  PersonDetectionCallbacks
} from "@/types/person-detection"
import { PersonDetector } from "@/lib/person-detection"
import { PersonStateAnalyzer } from "@/lib/person-state-analyzer"
import React, { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

interface PersonDetectionProps {
  videoElement: HTMLVideoElement | null
  enabled: boolean
  showOverlay?: boolean
  showPanel?: boolean
  onDetectionUpdate?: (result: PersonDetectionResult) => void
  onPersonEntered?: (personId: string) => void
  onPersonLeft?: (personId: string) => void
  className?: string
}

export const PersonDetection: React.FC<PersonDetectionProps> = ({
  videoElement,
  enabled,
  showOverlay = true,
  showPanel = true,
  onDetectionUpdate,
  onPersonEntered,
  onPersonLeft,
  className = ""
}) => {
  const detectorRef = useRef<PersonDetector | null>(null)
  const stateAnalyzerRef = useRef<PersonStateAnalyzer | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [detectionResult, setDetectionResult] = useState<PersonDetectionResult | null>(null)
  const [stats, setStats] = useState<PersonDetectionStats>({
    totalDetections: 0,
    averageStayDuration: 0,
    maxSimultaneousPersons: 0,
    lookingAtCameraCount: 0,
    interactingCount: 0
  })

  const [config, setConfig] = useState<PersonDetectionConfig>({
    detectionInterval: 200,
    minConfidence: 0.6,
    maxPersons: 10,
    motionSensitivity: 0.4,
    attentionSensitivity: 0.7,
    interactionSensitivity: 0.5,
    enableFaceRecognition: true,
    enablePoseDetection: true
  })

  // 检测回调
  const callbacks: PersonDetectionCallbacks = {
    onDetectionUpdate: useCallback((result: PersonDetectionResult) => {
      setDetectionResult(result)
      onDetectionUpdate?.(result)
      
      // 更新统计信息
      if (detectorRef.current) {
        setStats(detectorRef.current.getStats())
      }
    }, [onDetectionUpdate]),

    onPersonEntered: useCallback((person: any) => {
      toast.info(`检测到新人员: #${person.id.slice(-4)}`)
      onPersonEntered?.(person.id)
    }, [onPersonEntered]),

    onPersonLeft: useCallback((personId: string) => {
      toast.info(`人员离开: #${personId.slice(-4)}`)
      onPersonLeft?.(personId)
    }, [onPersonLeft]),

    onError: useCallback((error: Error) => {
      console.error("Person detection error:", error)
      toast.error(`人员检测错误: ${error.message}`)
    }, [])
  }

  // 初始化检测器
  useEffect(() => {
    let isMounted = true
    
    const initializeDetector = async () => {
      if (videoElement && enabled) {
        try {
          detectorRef.current = new PersonDetector(videoElement, config, callbacks)
          stateAnalyzerRef.current = new PersonStateAnalyzer()
          
          // 等待MediaPipe初始化完成
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          if (isMounted && isRunning && detectorRef.current) {
            await detectorRef.current.start()
          }
        } catch (error) {
          console.error("Failed to initialize person detector:", error)
          if (isMounted) {
            toast.error("人员检测初始化失败")
          }
        }
      }
    }

    initializeDetector()

    return () => {
      isMounted = false
      if (detectorRef.current) {
        detectorRef.current.stop()
      }
    }
  }, [videoElement, enabled])

  // 控制检测器运行状态
  useEffect(() => {
    const startDetector = async () => {
      if (detectorRef.current) {
        if (enabled && isRunning) {
          try {
            await detectorRef.current.start()
          } catch (error) {
            console.error("Failed to start detector:", error)
            toast.error("启动人员检测失败")
          }
        } else {
          detectorRef.current.stop()
        }
      }
    }
    
    startDetector()
  }, [enabled, isRunning])

  // 更新配置
  useEffect(() => {
    if (detectorRef.current) {
      detectorRef.current.updateConfig(config)
    }
    if (stateAnalyzerRef.current) {
      stateAnalyzerRef.current.updateConfig({
        attentionConfig: {
          headDirectionThreshold: 30,
          eyeContactConfidence: config.attentionSensitivity,
          faceVisibilityThreshold: 0.6
        },
        motionConfig: {
          approachingSpeedThreshold: config.motionSensitivity * 5,
          leavingSpeedThreshold: -config.motionSensitivity * 5,
          stationaryThreshold: 0.5,
          trackingHistoryFrames: 10
        },
        interactionConfig: {
          gestureDetectionSensitivity: config.interactionSensitivity,
          headMovementThreshold: 5.0,
          bodyLanguageWeight: 0.8
        }
      })
    }
  }, [config])

  const handleConfigChange = useCallback((newConfig: Partial<PersonDetectionConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }))
  }, [])

  const handleToggleDetection = useCallback(() => {
    if (!videoElement) {
      toast.error("请先启用摄像头")
      return
    }
    setIsRunning(prev => !prev)
  }, [videoElement])

  const handleResetStats = useCallback(() => {
    setStats({
      totalDetections: 0,
      averageStayDuration: 0,
      maxSimultaneousPersons: 0,
      lookingAtCameraCount: 0,
      interactingCount: 0
    })
    
    if (stateAnalyzerRef.current) {
      stateAnalyzerRef.current.clearHistory()
    }
    
    toast.success("统计信息已重置")
  }, [])

  if (!enabled) {
    return null
  }

  return (
    <div className={`person-detection-container ${className}`}>
      {/* 人员检测覆盖层 */}
      {showOverlay && videoElement && (
        <PersonDetectionOverlay
          detectionResult={detectionResult}
          videoWidth={videoElement.videoWidth || 640}
          videoHeight={videoElement.videoHeight || 480}
          showBoundingBoxes={true}
          showPersonDetails={true}
        />
      )}

      {/* 人员检测控制面板 */}
      {showPanel && (
        <PersonDetectionPanel
          config={config}
          stats={stats}
          isRunning={isRunning}
          onConfigChange={handleConfigChange}
          onToggleDetection={handleToggleDetection}
          onResetStats={handleResetStats}
          className="mt-4"
        />
      )}
    </div>
  )
}

export { PersonDetectionOverlay, PersonDetectionPanel }
export type { PersonDetectionProps }