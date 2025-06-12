"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { PersonDetectionConfig, PersonDetectionStats } from "@/types/person-detection"
import { Badge } from "@/components/ui/badge"
import { 
  Activity, 
  Eye, 
  Hand, 
  Settings, 
  TrendingUp, 
  Users, 
  Play,
  Pause,
  RotateCcw
} from "lucide-react"
import React from "react"

interface PersonDetectionPanelProps {
  config: PersonDetectionConfig
  stats: PersonDetectionStats
  isRunning: boolean
  onConfigChange: (config: Partial<PersonDetectionConfig>) => void
  onToggleDetection: () => void
  onResetStats: () => void
  className?: string
}

export const PersonDetectionPanel: React.FC<PersonDetectionPanelProps> = ({
  config,
  stats,
  isRunning,
  onConfigChange,
  onToggleDetection,
  onResetStats,
  className = ""
}) => {
  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            人员检测控制
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={isRunning ? "destructive" : "default"}
              onClick={onToggleDetection}
              className="flex items-center gap-1"
            >
              {isRunning ? (
                <>
                  <Pause className="h-3 w-3" />
                  停止
                </>
              ) : (
                <>
                  <Play className="h-3 w-3" />
                  开始
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onResetStats}
              className="flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              重置
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="stats" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="stats" className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              统计
            </TabsTrigger>
            <TabsTrigger value="detection" className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              检测
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-1">
              <Settings className="h-3 w-3" />
              高级
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="space-y-4">
            <StatsSection stats={stats} />
          </TabsContent>

          <TabsContent value="detection" className="space-y-4">
            <DetectionConfigSection config={config} onConfigChange={onConfigChange} />
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <AdvancedConfigSection config={config} onConfigChange={onConfigChange} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

interface StatsSectionProps {
  stats: PersonDetectionStats
}

const StatsSection: React.FC<StatsSectionProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">总检测人次</Label>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {stats.totalDetections}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">最大同时人数</Label>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            {stats.maxSimultaneousPersons}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">注意摄像头</Label>
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            {stats.lookingAtCameraCount}
          </Badge>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">正在交互</Label>
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            {stats.interactingCount}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">平均停留</Label>
          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
            {stats.averageStayDuration.toFixed(1)}s
          </Badge>
        </div>
      </div>
    </div>
  )
}

interface DetectionConfigSectionProps {
  config: PersonDetectionConfig
  onConfigChange: (config: Partial<PersonDetectionConfig>) => void
}

const DetectionConfigSection: React.FC<DetectionConfigSectionProps> = ({
  config,
  onConfigChange
}) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">检测间隔 (ms)</Label>
        <Slider
          value={[config.detectionInterval]}
          onValueChange={([value]) => onConfigChange({ detectionInterval: value })}
          min={50}
          max={1000}
          step={50}
          className="w-full"
        />
        <div className="text-xs text-gray-500 text-right">
          {config.detectionInterval}ms ({(1000 / config.detectionInterval).toFixed(1)} FPS)
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">最小置信度</Label>
        <Slider
          value={[config.minConfidence]}
          onValueChange={([value]) => onConfigChange({ minConfidence: value })}
          min={0.1}
          max={1.0}
          step={0.1}
          className="w-full"
        />
        <div className="text-xs text-gray-500 text-right">
          {(config.minConfidence * 100).toFixed(0)}%
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">最大跟踪人数</Label>
        <Slider
          value={[config.maxPersons]}
          onValueChange={([value]) => onConfigChange({ maxPersons: value })}
          min={1}
          max={20}
          step={1}
          className="w-full"
        />
        <div className="text-xs text-gray-500 text-right">
          {config.maxPersons} 人
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="face-recognition" className="text-sm font-medium">
            面部识别
          </Label>
          <Switch
            id="face-recognition"
            checked={config.enableFaceRecognition}
            onCheckedChange={(checked) => onConfigChange({ enableFaceRecognition: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="pose-detection" className="text-sm font-medium">
            姿态检测
          </Label>
          <Switch
            id="pose-detection"
            checked={config.enablePoseDetection}
            onCheckedChange={(checked) => onConfigChange({ enablePoseDetection: checked })}
          />
        </div>
      </div>
    </div>
  )
}

interface AdvancedConfigSectionProps {
  config: PersonDetectionConfig
  onConfigChange: (config: Partial<PersonDetectionConfig>) => void
}

const AdvancedConfigSection: React.FC<AdvancedConfigSectionProps> = ({
  config,
  onConfigChange
}) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          <Label className="text-sm font-medium">运动检测敏感度</Label>
        </div>
        <Slider
          value={[config.motionSensitivity]}
          onValueChange={([value]) => onConfigChange({ motionSensitivity: value })}
          min={0.1}
          max={1.0}
          step={0.1}
          className="w-full"
        />
        <div className="text-xs text-gray-500 text-right">
          {(config.motionSensitivity * 100).toFixed(0)}%
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          <Label className="text-sm font-medium">注意力检测敏感度</Label>
        </div>
        <Slider
          value={[config.attentionSensitivity]}
          onValueChange={([value]) => onConfigChange({ attentionSensitivity: value })}
          min={0.1}
          max={1.0}
          step={0.1}
          className="w-full"
        />
        <div className="text-xs text-gray-500 text-right">
          {(config.attentionSensitivity * 100).toFixed(0)}%
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Hand className="h-4 w-4" />
          <Label className="text-sm font-medium">交互检测敏感度</Label>
        </div>
        <Slider
          value={[config.interactionSensitivity]}
          onValueChange={([value]) => onConfigChange({ interactionSensitivity: value })}
          min={0.1}
          max={1.0}
          step={0.1}
          className="w-full"
        />
        <div className="text-xs text-gray-500 text-right">
          {(config.interactionSensitivity * 100).toFixed(0)}%
        </div>
      </div>
    </div>
  )
}