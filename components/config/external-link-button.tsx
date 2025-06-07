// 外部链接组件
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import React from "react"

export const ExternalLinkButton: React.FC<{
  title: string
  description: string
  url: string
}> = ({ title, description, url }) => (
  <Button
    variant="outline"
    size="sm"
    className="h-auto justify-start p-3 text-left"
    onClick={() => window.open(url, "_blank")}
  >
    <div className="flex items-start gap-3">
      <ExternalLink className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
      <div className="space-y-1">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-muted-foreground text-xs">{description}</div>
      </div>
    </div>
  </Button>
)