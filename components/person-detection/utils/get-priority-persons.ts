// 根据优先级排序人员并限制显示数量
import type { DetectedPerson } from "@/types/person-detection"

export const getPriorityPersons = (persons: DetectedPerson[]): DetectedPerson[] => {
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
    .slice(0, 1) // 最多显示N个人
}