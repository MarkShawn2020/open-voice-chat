"use client"

import { Config } from "@/components/config/config"
import { Button } from "@/components/ui/button"
import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"

interface ConfigModalProps {
  isOpen: boolean
  onClose: () => void
}

export const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose()
            }
          }}
        >
          <div className="flex h-full items-center justify-center p-4">
            <motion.div 
              className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-lg bg-white shadow-xl"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div 
                className="flex items-center justify-between border-b px-6 py-4"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <div>
                  <h2 className="text-xl font-semibold">完整配置</h2>
                  <p className="text-sm text-gray-600">火山引擎服务的详细配置参数</p>
                </div>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onClose} 
                    className="rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              </motion.div>
              <motion.div 
                className="max-h-[calc(90vh-80px)] overflow-y-auto p-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Config />
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}