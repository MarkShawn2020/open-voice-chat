"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { DetectedPerson, PersonDetectionResult } from "@/types/person-detection"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff, TrendingUp, TrendingDown, Hand, Users, Activity, Clock } from "lucide-react"
import React from "react"

// 系统状态类型
export type SystemState = 
  | "waiting"     // 没有启动
  | "starting"    // 启动中
  | "idle"        // 已启动但处于默认状态
  | "appealing"   // 吸引潜在用户注意力
  | "welcome"     // 用户注意到之后的开场白
  | "interacting" // 正在与用户交互
  | "goodbye"     // 用户走开

// 事件日志类型
export interface EventLog {
  id: string
  timestamp: number
  type: "person_detected" | "person_left" | "attention_gained" | "interaction_started" | "interaction_ended" | "state_changed"
  message: string
  severity: "info" | "warning" | "success" | "error"
}

interface PersonDetectionCardProps {
  detectionResult: PersonDetectionResult | null
  systemState: SystemState
  eventLogs: EventLog[]
  className?: string
}

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

// 获取系统状态的显示信息
const getSystemStateInfo = (state: SystemState) => {
  switch (state) {
    case "waiting":
      return { text: "等待启动", color: "bg-gray-500/20 text-gray-200", icon: Clock }
    case "starting":
      return { text: "启动中", color: "bg-blue-500/20 text-blue-200", icon: Activity }
    case "idle":
      return { text: "空闲待机", color: "bg-green-500/20 text-green-200", icon: Users }
    case "appealing":
      return { text: "吸引注意", color: "bg-yellow-500/20 text-yellow-200", icon: Eye }
    case "welcome":
      return { text: "欢迎用户", color: "bg-purple-500/20 text-purple-200", icon: Hand }
    case "interacting":
      return { text: "交互中", color: "bg-orange-500/20 text-orange-200", icon: TrendingUp }
    case "goodbye":
      return { text: "告别用户", color: "bg-red-500/20 text-red-200", icon: TrendingDown }
  }
}

export const PersonDetectionCard: React.FC<PersonDetectionCardProps> = ({
  detectionResult,
  systemState,
  eventLogs,
  className = ""
}) => {
  const personCount = detectionResult?.totalCount || 0
  const stateInfo = getSystemStateInfo(systemState)
  const StateIcon = stateInfo.icon
  
  // 获取最近的事件日志
  const recentLogs = eventLogs.slice(-5).reverse()

  return (
    <Card className={cn("bg-background border", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            人员检测
            <Badge variant="secondary" className="ml-2">
              {personCount}人
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <StateIcon className="h-4 w-4" />
            <Badge className={stateInfo.color}>
              {stateInfo.text}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 检测统计信息 */}
        {detectionResult && (
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="text-center">
              <div className="text-2xl font-semibold text-green-600">
                {detectionResult.persons.filter(p => p.state.isLookingAtCamera).length}
              </div>
              <div className="text-muted-foreground">注意摄像头</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-orange-600">
                {detectionResult.persons.filter(p => p.state.isInteracting).length}
              </div>
              <div className="text-muted-foreground">正在交互</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-blue-600">
                {detectionResult.processingTime}ms
              </div>
              <div className="text-muted-foreground">处理时间</div>
            </div>
          </div>
        )}

        {/* 人员详细信息 */}
        {detectionResult && detectionResult.persons.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">当前交互人员</h4>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              <AnimatePresence>
                {getPriorityPersons(detectionResult.persons).map((person, index) => (
                  <PersonDetailCard key={person.id} person={person} index={index + 1} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* 事件日志 */}
        <div>
          <h4 className="text-sm font-medium mb-2">事件日志</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {recentLogs.length > 0 ? (
              recentLogs.map((log) => (
                <motion.div
                  key={log.id}
                  className="text-xs flex items-center gap-2 p-2 rounded bg-muted/50"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    log.severity === "success" && "bg-green-500",
                    log.severity === "warning" && "bg-yellow-500",
                    log.severity === "error" && "bg-red-500",
                    log.severity === "info" && "bg-blue-500"
                  )} />
                  <span className="text-muted-foreground">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="flex-1">{log.message}</span>
                </motion.div>
              ))
            ) : (
              <div className="text-xs text-muted-foreground text-center py-2">
                暂无事件记录
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
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
    if (person.gestureState.isPinching) return { icon: "🤏", text: "捏合", color: "text-purple-600" }
    if (person.gestureState.isPointing) return { icon: "👉", text: "指向", color: "text-blue-600" }
    if (person.gestureState.isWaving) return { icon: "👋", text: "挥手", color: "text-green-600" }
    if (person.gestureState.isThumpsUp) return { icon: "👍", text: "点赞", color: "text-yellow-600" }
    return null
  }

  const primaryGesture = getPrimaryGesture()

  return (
    <motion.div
      className="h-24"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.05 }}
      layout
    >
      <Card className="h-full border border-border/50">
        <CardHeader className="pb-1 px-3 pt-2">
          <CardTitle className="text-xs flex items-center justify-between">
            <span>#{person.id.slice(-4)}</span>
            <Badge
              variant="secondary"
              className={cn(
                "text-xs px-1 py-0",
                person.confidence > 0.8
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : person.confidence > 0.6
                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              )}
            >
              {(person.confidence * 100).toFixed(0)}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-2 space-y-1">
          {/* 状态指示器 */}
          <div className="flex items-center gap-2">
            {person.state.isLookingAtCamera && (
              <Eye className="h-3 w-3 text-green-600" />
            )}
            {person.state.isInteracting && (
              <Hand className="h-3 w-3 text-orange-600" />
            )}
            {person.state.isApproaching && (
              <TrendingUp className="h-3 w-3 text-blue-600" />
            )}
            {person.state.isLeaving && (
              <TrendingDown className="h-3 w-3 text-red-600" />
            )}
            {person.features.eyesDetected && (
              <span className="text-xs">👁️</span>
            )}
          </div>

          {/* 注意力条 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">注意力</span>
            <div className="flex-1 h-1 bg-muted rounded">
              <div
                className="h-full bg-blue-600 rounded transition-all duration-300"
                style={{ width: `${person.state.attentionLevel * 100}%` }}
              />
            </div>
          </div>

          {/* 手势显示 */}
          <div className={cn("flex items-center gap-2", !primaryGesture && "opacity-0")}>
            <span className="text-xs">{primaryGesture?.icon}</span>
            <span className={`text-xs ${primaryGesture?.color}`}>
              {primaryGesture?.text}
            </span>
            {person.gestureState && person.gestureState.confidence > 0 && (
              <span className="text-xs text-muted-foreground ml-auto">
                {(person.gestureState.confidence * 100).toFixed(0)}%
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}