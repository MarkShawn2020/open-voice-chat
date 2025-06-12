"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DetectedPerson, PersonDetectionResult } from "@/types/person-detection"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff, TrendingUp, TrendingDown, Hand, Users } from "lucide-react"
import React from "react"

interface PersonDetectionOverlayProps {
  detectionResult: PersonDetectionResult | null
  videoWidth: number
  videoHeight: number
  showBoundingBoxes?: boolean
  showPersonDetails?: boolean
  className?: string
}

export const PersonDetectionOverlay: React.FC<PersonDetectionOverlayProps> = ({
  detectionResult,
  videoWidth,
  videoHeight,
  showBoundingBoxes = true,
  showPersonDetails = true,
  className = ""
}) => {
  if (!detectionResult) return null

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {/* 人员边界框 */}
      {showBoundingBoxes && (
        <AnimatePresence>
          {detectionResult.persons.map((person) => (
            <PersonBoundingBox
              key={person.id}
              person={person}
              videoWidth={videoWidth}
              videoHeight={videoHeight}
            />
          ))}
        </AnimatePresence>
      )}

      {/* 检测统计信息 */}
      <motion.div
        className="absolute top-2 left-2 z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-black/70 backdrop-blur-sm border-white/20 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              人员检测
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span>检测人数:</span>
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-200">
                {detectionResult.totalCount}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>注意摄像头:</span>
              <Badge variant="secondary" className="bg-green-500/20 text-green-200">
                {detectionResult.persons.filter(p => p.state.isLookingAtCamera).length}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>正在交互:</span>
              <Badge variant="secondary" className="bg-orange-500/20 text-orange-200">
                {detectionResult.persons.filter(p => p.state.isInteracting).length}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>处理时间:</span>
              <Badge variant="secondary" className="bg-gray-500/20 text-gray-200">
                {detectionResult.processingTime}ms
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 人员详细信息列表 */}
      {showPersonDetails && detectionResult.persons.length > 0 && (
        <motion.div
          className="absolute bottom-2 right-2 z-10 max-w-80"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {detectionResult.persons.map((person, index) => (
              <PersonDetailCard key={person.id} person={person} index={index + 1} />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

interface PersonBoundingBoxProps {
  person: DetectedPerson
  videoWidth: number
  videoHeight: number
}

const PersonBoundingBox: React.FC<PersonBoundingBoxProps> = ({
  person,
  videoWidth,
  videoHeight
}) => {
  // 计算相对位置（百分比）
  const left = (person.position.x / videoWidth) * 100
  const top = (person.position.y / videoHeight) * 100
  const width = (person.position.width / videoWidth) * 100
  const height = (person.position.height / videoHeight) * 100

  // 根据状态选择颜色
  const getBorderColor = () => {
    if (person.state.isInteracting) return "border-orange-400"
    if (person.state.isLookingAtCamera) return "border-green-400"
    if (person.state.isApproaching) return "border-blue-400"
    if (person.state.isLeaving) return "border-red-400"
    return "border-gray-400"
  }

  const getBackgroundColor = () => {
    if (person.state.isInteracting) return "bg-orange-400/10"
    if (person.state.isLookingAtCamera) return "bg-green-400/10"
    if (person.state.isApproaching) return "bg-blue-400/10"
    if (person.state.isLeaving) return "bg-red-400/10"
    return "bg-gray-400/10"
  }

  return (
    <motion.div
      className={`absolute border-2 ${getBorderColor()} ${getBackgroundColor()} rounded-lg`}
      style={{
        left: `${left}%`,
        top: `${top}%`,
        width: `${width}%`,
        height: `${height}%`
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
    >
      {/* 人员ID标签 */}
      <motion.div
        className="absolute -top-6 left-0 bg-black/70 text-white text-xs px-2 py-1 rounded"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        #{person.id.slice(-4)}
      </motion.div>

      {/* 状态指示器 */}
      <div className="absolute top-1 right-1 flex gap-1">
        {person.state.isLookingAtCamera && (
          <motion.div
            className="w-3 h-3 rounded-full bg-green-400"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Eye className="w-2 h-2 text-white m-0.5" />
          </motion.div>
        )}
        {person.state.isInteracting && (
          <motion.div
            className="w-3 h-3 rounded-full bg-orange-400"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.25 }}
          >
            <Hand className="w-2 h-2 text-white m-0.5" />
          </motion.div>
        )}
        {person.state.isApproaching && (
          <motion.div
            className="w-3 h-3 rounded-full bg-blue-400"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <TrendingUp className="w-2 h-2 text-white m-0.5" />
          </motion.div>
        )}
        {person.state.isLeaving && (
          <motion.div
            className="w-3 h-3 rounded-full bg-red-400"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <TrendingDown className="w-2 h-2 text-white m-0.5" />
          </motion.div>
        )}
      </div>

      {/* 置信度条 */}
      <div className="absolute bottom-1 left-1 right-1">
        <div className="w-full h-1 bg-black/30 rounded">
          <motion.div
            className="h-full bg-white rounded"
            initial={{ width: 0 }}
            animate={{ width: `${person.confidence * 100}%` }}
            transition={{ delay: 0.4, duration: 0.5 }}
          />
        </div>
      </div>
    </motion.div>
  )
}

interface PersonDetailCardProps {
  person: DetectedPerson
  index: number
}

const PersonDetailCard: React.FC<PersonDetailCardProps> = ({ person, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="bg-black/70 backdrop-blur-sm border-white/20 text-white text-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <span>人员 #{person.id.slice(-4)}</span>
            <Badge
              variant="secondary"
              className={`text-xs ${
                person.confidence > 0.8
                  ? "bg-green-500/20 text-green-200"
                  : person.confidence > 0.6
                  ? "bg-yellow-500/20 text-yellow-200"
                  : "bg-red-500/20 text-red-200"
              }`}
            >
              {(person.confidence * 100).toFixed(0)}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="flex items-center gap-2">
            {person.state.isLookingAtCamera ? (
              <Eye className="h-3 w-3 text-green-400" />
            ) : (
              <EyeOff className="h-3 w-3 text-gray-400" />
            )}
            <span className="text-xs">
              {person.state.isLookingAtCamera ? "注意摄像头" : "未注意"}
            </span>
          </div>
          
          {person.state.isApproaching && (
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3 w-3 text-blue-400" />
              <span className="text-xs">正在接近</span>
            </div>
          )}
          
          {person.state.isLeaving && (
            <div className="flex items-center gap-2">
              <TrendingDown className="h-3 w-3 text-red-400" />
              <span className="text-xs">正在离开</span>
            </div>
          )}
          
          {person.state.isInteracting && (
            <div className="flex items-center gap-2">
              <Hand className="h-3 w-3 text-orange-400" />
              <span className="text-xs">正在交互</span>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span>注意力:</span>
            <div className="w-12 h-1 bg-gray-600 rounded">
              <div
                className="h-full bg-blue-400 rounded"
                style={{ width: `${person.state.attentionLevel * 100}%` }}
              />
            </div>
          </div>
          
          {person.features.eyesDetected && (
            <div className="text-xs text-green-400">👁️ 检测到眼睛</div>
          )}

          {/* 手势显示 */}
          {person.gestureState && (
            <div className="space-y-1 pt-1 border-t border-white/10">
              <div className="text-xs text-gray-300">手势:</div>
              {person.gestureState.isPinching && (
                <div className="flex items-center gap-2">
                  <span className="text-xs">🤏</span>
                  <span className="text-xs text-purple-400">捏合</span>
                </div>
              )}
              {person.gestureState.isPointing && (
                <div className="flex items-center gap-2">
                  <span className="text-xs">👉</span>
                  <span className="text-xs text-blue-400">指向</span>
                </div>
              )}
              {person.gestureState.isWaving && (
                <div className="flex items-center gap-2">
                  <span className="text-xs">👋</span>
                  <span className="text-xs text-green-400">挥手</span>
                </div>
              )}
              {person.gestureState.isThumpsUp && (
                <div className="flex items-center gap-2">
                  <span className="text-xs">👍</span>
                  <span className="text-xs text-yellow-400">点赞</span>
                </div>
              )}
              {person.gestureState.confidence > 0 && (
                <div className="text-xs text-gray-400">
                  置信度: {(person.gestureState.confidence * 100).toFixed(0)}%
                </div>
              )}
            </div>
          )}
          
          <div className="text-xs text-gray-400">
            检测时间: {new Date(person.timestamp).toLocaleTimeString()}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}