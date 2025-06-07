"use client"

import { Settings } from "lucide-react"
import { useState } from "react"

import { Config } from "@/components/config/config"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export const SettingsModal = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuration Settings
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-auto max-h-[80vh] pr-2">
          <Config />
        </div>
      </DialogContent>
    </Dialog>
  )
}
