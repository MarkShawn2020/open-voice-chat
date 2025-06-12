"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle, Play } from "lucide-react"

import { TestResult } from "./types"

interface DebugPanelProps {
  testResults: TestResult[]
  onRunModuleTest: (module: string) => void
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  testResults,
  onRunModuleTest,
}) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">模块测试</CardTitle>
        <CardDescription className="text-sm">测试各个服务模块的连接状态</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {["rtc", "asr", "tts", "llm"].map((module) => {
            const result = testResults.find((t) => t.module === module)
            return (
              <div key={module} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor:
                        result?.status === "success"
                          ? "#10b981"
                          : result?.status === "error"
                            ? "#ef4444"
                            : result?.status === "testing"
                              ? "#f59e0b"
                              : "#d1d5db",
                    }}
                  />
                  <span className="text-sm font-medium uppercase">{module}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRunModuleTest(module)}
                  disabled={result?.status === "testing"}
                  className="h-7 px-2"
                >
                  <Play className="h-3 w-3" />
                </Button>
              </div>
            )
          })}
        </div>

        {testResults.length > 0 && (
          <div className="mt-4 max-h-40 space-y-2 overflow-y-auto">
            <Label className="text-sm font-medium">测试结果</Label>
            {testResults.slice(-5).map((result, idx) => (
              <div key={idx} className="rounded bg-gray-50 p-2">
                <div className="flex items-center gap-1">
                  {result.status === "success" && <CheckCircle className="h-3 w-3 text-green-500" />}
                  {result.status === "error" && <AlertCircle className="h-3 w-3 text-red-500" />}
                  <span className="text-xs font-medium">{result.module}</span>
                </div>
                <div className="text-xs text-gray-600">{result.message}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}