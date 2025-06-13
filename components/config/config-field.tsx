// 配置字段组件
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle2, Copy, Eye, EyeOff } from "lucide-react"
import React, { useState } from "react"

export const ConfigField: React.FC<{
  label: string
  description?: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  type?: "text" | "password"
  copyable?: boolean
  disabled?: boolean
}> = ({ label, description, placeholder, value, onChange, type = "text", copyable = false, disabled = false }) => {
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("复制失败:", error)
    }
  }

  const inputType = type === "password" && !showPassword ? "password" : "text"

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        {type === "password" && (
          <Button variant="ghost" size="sm" onClick={() => setShowPassword(!showPassword)} className="h-6 px-2">
            {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </Button>
        )}
      </div>
      {description && <p className="text-muted-foreground text-xs">{description}</p>}
      <div className="relative">
        <Input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pr-10"
          disabled={disabled}
        />
        {copyable && value && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="absolute top-1/2 right-2 h-6 w-6 -translate-y-1/2 p-0"
          >
            {copied ? <CheckCircle2 className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
          </Button>
        )}
      </div>
    </div>
  )
}