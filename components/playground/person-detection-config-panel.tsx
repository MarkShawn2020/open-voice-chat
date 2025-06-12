"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { PersonDetectionPanel } from "@/components/person-detection/person-detection-panel"
import type { PersonDetectionConfig, PersonDetectionStats } from "@/types/person-detection"
import { Users, Eye, Activity } from "lucide-react"
import React from "react"

interface PersonDetectionConfigPanelProps {
  enabled: boolean
  isRunning: boolean
  config: PersonDetectionConfig
  stats: PersonDetectionStats
  onToggle: () => void
  onConfigChange: (config: Partial<PersonDetectionConfig>) => void
  onResetStats: () => void
  cameraEnabled: boolean
}

export const PersonDetectionConfigPanel: React.FC<PersonDetectionConfigPanelProps> = ({
  enabled,
  isRunning,
  config,
  stats,
  onToggle,
  onConfigChange,
  onResetStats,
  cameraEnabled
}) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4" />
          人员检测
        </CardTitle>
        <CardDescription className="text-sm">
          智能识别展览场景中的观众行为
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 启用开关 */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">启用人员检测</Label>
            <p className="text-xs text-gray-500">
              需要先启用摄像头
            </p>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={onToggle}
            disabled={!cameraEnabled}
          />
        </div>

        {/* 实时统计 */}
        {enabled && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50">
                <Activity className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="text-xs text-blue-600 font-medium">检测人数</div>
                  <div className="text-sm font-bold text-blue-800">{stats.lookingAtCameraCount}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50">
                <Eye className="h-4 w-4 text-green-600" />
                <div>
                  <div className="text-xs text-green-600 font-medium">注意摄像头</div>
                  <div className="text-sm font-bold text-green-800">{stats.lookingAtCameraCount}</div>
                </div>
              </div>
            </div>

            {/* 详细配置面板 */}
            <PersonDetectionPanel
              config={config}
              stats={stats}
              isRunning={isRunning}
              onConfigChange={onConfigChange}
              onToggleDetection={onToggle}
              onResetStats={onResetStats}
            />
          </div>
        )}

        {/* 禁用状态提示 */}
        {!cameraEnabled && (
          <div className="text-center py-4 text-gray-500">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">请先启用摄像头以使用人员检测功能</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}