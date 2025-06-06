import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useInitMics, useMicActions, useMicStore, useUpdateMicVolume } from "@/store/mic"

export const CurMicVolume = () => {
  const { curMicState } = useMicStore()
  const { toggleMic } = useMicActions()
  useUpdateMicVolume()

  return (
    <div className="space-y-3 rounded-lg border bg-gray-50 p-4">
      <h4 className="text-sm font-semibold text-gray-800">Microphone Control</h4>

      

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
export const Mics = () => {
  const { mics, curMicId } = useMicStore()
  const { changeMic } = useMicActions()
  useInitMics()

  console.log({ mics, curMicId })

  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      <h3 className="text-center text-lg font-semibold">Select Microphone</h3>

      <CurMicVolume />

      <div className="space-y-3">
        {mics.map((mic, index) => {
          const isSelected = curMicId === mic.deviceId
          return (
            <div key={index} className="space-y-3">
              <div
                className={`flex items-center space-x-3 rounded-lg border p-3 transition-colors ${
                  isSelected ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"
                }`}
              >
                <Checkbox id={`mic-${index}`} checked={isSelected} onCheckedChange={() => changeMic(mic.deviceId)} />
                <div className="min-w-0 flex-1">
                  <Label
                    htmlFor={`mic-${index}`}
                    className="block cursor-pointer truncate text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {mic.label || `Microphone ${index + 1}`}
                  </Label>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}