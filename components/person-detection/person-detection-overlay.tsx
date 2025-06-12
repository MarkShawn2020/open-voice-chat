"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { DetectedPerson, PersonDetectionResult } from "@/types/person-detection"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff, TrendingUp, TrendingDown, Hand, Users } from "lucide-react"
import React from "react"

// 根据优先级排序人员并限制显示数量
const getPriorityPersons = (persons: DetectedPerson[]): DetectedPerson[] => {
  return persons
    .sort((a, b) => {
      // 优先级排序：交互中 > 注视摄像头 > 正在接近 > 置信度高
      if (a.state.isInteracting !== b.state.isInteracting) {
        return a.state.isInteracting ? -1 : 1
      }
      if (a.state.isLookingAtCamera !== b.state.isLookingAtCamera) {
        return a.state.isLookingAtCamera ? -1 : 1
      }
      if (a.state.isApproaching !== b.state.isApproaching) {
        return a.state.isApproaching ? -1 : 1
      }
      return b.confidence - a.confidence
    })
    .slice(0, 6) // 最多显示6个人
}

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
      {showPersonDetails && (
        <motion.div
          className="absolute bottom-2 right-2 z-10 z-[9999]"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="h-80 overflow-hidden">
            <motion.div
              className="flex flex-col gap-2 h-full overflow-y-auto"
              layout
            >
              {getPriorityPersons(detectionResult.persons).map((person, index) => (
                <PersonDetailCard key={person.id} person={person} index={index + 1} />
              ))}
            </motion.div>
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
  // 获取主要手势
  const getPrimaryGesture = () => {
    if (!person.gestureState) return null
    if (person.gestureState.isPinching) return { icon: "🤏", text: "捏合", color: "text-purple-400" }
    if (person.gestureState.isPointing) return { icon: "👉", text: "指向", color: "text-blue-400" }
    if (person.gestureState.isWaving) return { icon: "👋", text: "挥手", color: "text-green-400" }
    if (person.gestureState.isThumpsUp) return { icon: "👍", text: "点赞", color: "text-yellow-400" }
    return null
  }

  const primaryGesture = getPrimaryGesture()

  return (
    <motion.div
      className="h-32"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.05 }}
      layout
    >
      <Card className="bg-black/70 backdrop-blur-sm border-white/20 text-white text-xs h-full w-[320px]">
        <CardHeader className="pb-1 px-3 pt-2 ">
          <CardTitle className="text-xs flex items-center justify-between">
            <span>#{person.id.slice(-4)}</span>
            <Badge
              variant="secondary"
              className={`text-xs px-1 py-0 ${person.confidence > 0.8
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
        <CardContent className="px-3 pb-2 space-y-1">
          {/* 状态指示器 */}
          <div className="flex items-center gap-2">
            {person.state.isLookingAtCamera && (
              <Eye className="h-3 w-3 text-green-400" />
            )}
            {person.state.isInteracting && (
              <Hand className="h-3 w-3 text-orange-400" />
            )}
            {person.state.isApproaching && (
              <TrendingUp className="h-3 w-3 text-blue-400" />
            )}
            {person.state.isLeaving && (
              <TrendingDown className="h-3 w-3 text-red-400" />
            )}
            {person.features.eyesDetected && (
              <span className="text-xs">👁️</span>
            )}
          </div>

          {/* 注意力条 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-300">注意力</span>
            <div className="flex-1 h-1 bg-gray-600 rounded">
              <div
                className="h-full bg-blue-400 rounded transition-all duration-300"
                style={{ width: `${person.state.attentionLevel * 100}%` }}
              />
            </div>
          </div>

          {/* 手势显示 */}
          <div className={cn("flex items-center gap-2 pt-1", !primaryGesture && "opacity-0")}>
              <span className="text-xs">{primaryGesture?.icon}</span>
              <span className={`text-xs ${primaryGesture?.color}`}>
                {primaryGesture?.text}
              </span>
              {person.gestureState && person.gestureState.confidence > 0 && (
                <span className="text-xs text-gray-400 ml-auto">
                  {(person.gestureState.confidence * 100).toFixed(0)}%
                </span>
              )}
            </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}