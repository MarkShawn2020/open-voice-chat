"use client"

import { PersonDetailCard } from "@/components/person-detection/person-detail-card"
import { EventLog, SystemState } from "@/components/person-detection/types"
import { getPriorityPersons } from "@/components/person-detection/utils/get-priority-persons"
import { getSystemStateInfo } from "@/components/person-detection/utils/get-system-state-info"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { PersonDetectionResult } from "@/types/person-detection"
import { AnimatePresence, motion } from "framer-motion"
import { Users } from "lucide-react"
import React from "react"

export const PersonDetectionCard: React.FC<{
  detectionResult: PersonDetectionResult | null
  systemState: SystemState
  eventLogs: EventLog[]
  className?: string
}> = ({ detectionResult, systemState, eventLogs, className = "" }) => {
  const personCount = detectionResult?.totalCount || 0
  const stateInfo = getSystemStateInfo(systemState)
  const StateIcon = stateInfo.icon

  // 获取最近的事件日志
  const recentLogs = eventLogs.slice(-5).reverse()

  return (
    <Card className={cn("bg-background border", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            人员检测
            <Badge variant="secondary" className="ml-2">
              {personCount}人
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <StateIcon className="h-4 w-4" />
            <Badge className={stateInfo.color}>{stateInfo.text}</Badge>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 检测统计信息 */}
        {detectionResult && (
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="text-center">
              <div className="text-2xl font-semibold text-green-600">
                {detectionResult.persons.filter((p) => p.state.isLookingAtCamera).length}
              </div>
              <div className="text-muted-foreground">注意摄像头</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-orange-600">
                {detectionResult.persons.filter((p) => p.state.isInteracting).length}
              </div>
              <div className="text-muted-foreground">正在交互</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-blue-600">{detectionResult.processingTime}ms</div>
              <div className="text-muted-foreground">处理时间</div>
            </div>
          </div>
        )}

        {/* 人员详细信息 */}
        <div>
          <h4 className="mb-2 text-sm font-medium">当前交互人员</h4>
          <AnimatePresence>
               {getPriorityPersons(detectionResult?.persons ?? []).map((person, index) => (
                  <PersonDetailCard key={person.id} person={person} index={index + 1} />
                ))}
          </AnimatePresence>
        </div>

        {/* 事件日志 */}
        <div>
          <h4 className="mb-2 text-sm font-medium">事件日志</h4>
          <div className="max-h-32 space-y-1 overflow-y-auto">
            {recentLogs.length > 0 ? (
              recentLogs.map((log) => (
                <motion.div
                  key={log.id}
                  className="bg-muted/50 flex items-center gap-2 rounded p-2 text-xs"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      log.severity === "success" && "bg-green-500",
                      log.severity === "warning" && "bg-yellow-500",
                      log.severity === "error" && "bg-red-500",
                      log.severity === "info" && "bg-blue-500"
                    )}
                  />
                  <span className="text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span className="flex-1">{log.message}</span>
                </motion.div>
              ))
            ) : (
              <div className="text-muted-foreground py-2 text-center text-xs">暂无事件记录</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
