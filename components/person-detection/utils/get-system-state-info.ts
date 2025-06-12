// 获取系统状态的显示信息

import { SystemState } from "@/components/person-detection/types"
import { Activity, Clock, Eye, Hand, TrendingDown, TrendingUp, Users } from "lucide-react"

export const getSystemStateInfo = (state: SystemState) => {
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