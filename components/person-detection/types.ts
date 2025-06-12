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