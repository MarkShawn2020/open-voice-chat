import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useInitMics, useMicActions, useMicStore, useUpdateMicVolume } from "@/store/mic"

export const MicControl = () => {
  const { curMicState, mics, curMicId } = useMicStore()
  const { toggleMic, changeMic } = useMicActions()
  useUpdateMicVolume()
  useInitMics()

  return (
    <div className="space-y-3 rounded-lg border bg-gray-50 p-4 w-[320px]">
      <h4 className="text-sm font-semibold text-gray-800">Microphone Control</h4>

      {/* 麦克风选择下拉框 */}
      {mics.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-gray-600">Select Microphone</Label>
          <Select value={curMicId || ""} onValueChange={changeMic}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a microphone..." />
            </SelectTrigger>
            <SelectContent>
              {mics.map((mic, index) => {
                const deviceId = mic.deviceId || `mic-${index}`
                return (
                  <SelectItem key={deviceId} value={deviceId}>
                    {mic.label || `Microphone ${index + 1}`}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* 权限状态 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div
            className={`h-3 w-3 rounded-full ${curMicState.isPermissionGranted ? "bg-green-500" : "bg-red-500"}`}
          ></div>
          <span className="text-sm text-gray-600">Microphone Permission</span>
        </div>
        <span className={`text-xs font-medium ${curMicState.isPermissionGranted ? "text-green-600" : "text-red-600"}`}>
          {curMicState.isPermissionGranted ? "Granted" : "Denied"}
        </span>
      </div>

      {/* 开关状态 - 可交互 */}
      <div className="flex items-center justify-between">
        <Label htmlFor="mic-switch" className="text-sm text-gray-600">
          Microphone Active
        </Label>
        <Switch
          id="mic-switch"
          checked={curMicState.isOn}
          onCheckedChange={toggleMic}
          disabled={!curMicState.isPermissionGranted}
        />
      </div>

      {/* 音量指示器 */}
      {curMicState.isPermissionGranted && curMicState.isOn && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Volume Level</span>
            <span className="font-mono text-xs text-gray-500">{Math.round(curMicState.volume * 100)}%</span>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 transition-all duration-100"
              style={{ width: `${Math.min(curMicState.volume * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  )
}