// 时间戳组件
import React from "react"

export const TimeStamp: React.FC<{ timestamp: number }> = ({ timestamp }) => {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    if (messageDate.getTime() === today.getTime()) {
      // 今天：显示时分
      return date.toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    } else if (messageDate.getTime() === today.getTime() - 24 * 60 * 60 * 1000) {
      // 昨天
      return `昨天 ${date.toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
      })}`
    } else {
      // 更早：显示月日和时分
      return date.toLocaleString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    }
  }

  return (
    <div className="my-4 flex justify-center">
      <span className="rounded-full bg-gray-50 px-3 py-1 text-xs text-gray-400">{formatTime(timestamp)}</span>
    </div>
  )
}