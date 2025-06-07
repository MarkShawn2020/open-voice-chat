// 配置状态组件
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import React from "react"

export const ConfigStatus: React.FC<{ errors: string[] }> = ({ errors }) => {
  const isComplete = errors.length === 0

  return (
    <Alert className={isComplete ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}>
      {isComplete ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : (
        <AlertCircle className="h-4 w-4 text-amber-600" />
      )}
      <AlertDescription className={isComplete ? "text-green-800" : "text-amber-800"}>
        {isComplete ? "🎉 配置完成！可以开始语音对话了" : `还有 ${errors.length} 项配置需要完善`}
      </AlertDescription>
    </Alert>
  )
}