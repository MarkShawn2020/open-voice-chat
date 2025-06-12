import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { DetectedPerson } from "@/types/person-detection"
import { motion } from "framer-motion"
import { Eye, Hand, TrendingDown, TrendingUp } from "lucide-react"
import React from "react"

export const PersonDetailCard: React.FC<{
  person: DetectedPerson
  index: number
}> = ({ person, index }) => {
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
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.05 }}
      layout
    >
      <Card className="border-border/50 h-full w-full border">
        <CardHeader className="px-3 pt-2 pb-1">
          <CardTitle className="flex items-center justify-between text-xs">
            <span>#{person.id.slice(-4)}</span>
            <Badge
              variant="secondary"
              className={cn(
                "px-1 py-0 text-xs",
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
        <CardContent className="space-y-1 px-3 pb-2">
          {/* 状态指示器 */}
          <div className="flex items-center gap-2">
            {person.state.isLookingAtCamera && <Eye className="h-3 w-3 text-green-600" />}
            {person.state.isInteracting && <Hand className="h-3 w-3 text-orange-600" />}
            {person.state.isApproaching && <TrendingUp className="h-3 w-3 text-blue-600" />}
            {person.state.isLeaving && <TrendingDown className="h-3 w-3 text-red-600" />}
            {person.features.eyesDetected && <span className="text-xs">👁️</span>}
          </div>

          {/* 注意力条 */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">注意力</span>
            <div className="bg-muted h-1 flex-1 rounded">
              <div
                className="h-full rounded bg-blue-600 transition-all duration-300"
                style={{ width: `${person.state.attentionLevel * 100}%` }}
              />
            </div>
          </div>

          {/* 手势显示 */}
          <div className={cn("flex items-center gap-2", !primaryGesture && "opacity-0")}>
            <span className="text-xs">{primaryGesture?.icon}</span>
            <span className={`text-xs ${primaryGesture?.color}`}>{primaryGesture?.text}</span>
            {person.gestureState && person.gestureState.confidence > 0 && (
              <span className="text-muted-foreground ml-auto text-xs">
                {(person.gestureState.confidence * 100).toFixed(0)}%
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}