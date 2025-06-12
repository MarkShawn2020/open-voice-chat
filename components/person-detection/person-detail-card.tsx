import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { DetectedPerson } from "@/types/person-detection"
import { motion } from "framer-motion"
import { Eye, Hand, TrendingDown, TrendingUp } from "lucide-react"
import React from "react"

export const PersonDetailCard: React.FC<PersonDetailCardProps> = ({ person, index }) => {
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
      <Card className="h-full w-[320px] border-white/20 bg-black/70 text-xs text-white backdrop-blur-sm">
        <CardHeader className="px-3 pt-2 pb-1">
          <CardTitle className="flex items-center justify-between text-xs">
            <span>#{person.id.slice(-4)}</span>
            <Badge
              variant="secondary"
              className={`px-1 py-0 text-xs ${
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
        <CardContent className="space-y-1 px-3 pb-2">
          {/* 状态指示器 */}
          <div className="flex items-center gap-2">
            {person.state.isLookingAtCamera && <Eye className="h-3 w-3 text-green-400" />}
            {person.state.isInteracting && <Hand className="h-3 w-3 text-orange-400" />}
            {person.state.isApproaching && <TrendingUp className="h-3 w-3 text-blue-400" />}
            {person.state.isLeaving && <TrendingDown className="h-3 w-3 text-red-400" />}
            {person.features.eyesDetected && <span className="text-xs">👁️</span>}
          </div>

          {/* 注意力条 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-300">注意力</span>
            <div className="h-1 flex-1 rounded bg-gray-600">
              <div
                className="h-full rounded bg-blue-400 transition-all duration-300"
                style={{ width: `${person.state.attentionLevel * 100}%` }}
              />
            </div>
          </div>

          {/* 手势显示 */}
          <div className={cn("flex items-center gap-2 pt-1", !primaryGesture && "opacity-0")}>
            <span className="text-xs">{primaryGesture?.icon}</span>
            <span className={`text-xs ${primaryGesture?.color}`}>{primaryGesture?.text}</span>
            {person.gestureState && person.gestureState.confidence > 0 && (
              <span className="ml-auto text-xs text-gray-400">
                {(person.gestureState.confidence * 100).toFixed(0)}%
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

interface PersonDetailCardProps {
  person: DetectedPerson
  index: number
}