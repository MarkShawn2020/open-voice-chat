"use client"

import { Button } from "@/components/ui/button"
import { AnimatePresence, motion, useAnimation } from "framer-motion"
import { AlertCircle, Camera, X } from "lucide-react"
import { useEffect, useState } from "react"

interface CameraPreviewProps {
  isCameraEnabled: boolean
  cameraStream: MediaStream | null
  cameraError: string | null
  onCameraToggle: () => void
}

export const CameraPreview: React.FC<CameraPreviewProps> = ({
  isCameraEnabled,
  cameraStream,
  cameraError,
  onCameraToggle,
}) => {
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null)
  const [isSnapping, setIsSnapping] = useState(false)
  const [dragConstraints, setDragConstraints] = useState({
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  })
  const controls = useAnimation()

  useEffect(() => {
    const updateConstraints = () => {
      if (typeof window !== 'undefined') {
        const windowWidth = window.innerWidth
        const windowHeight = window.innerHeight
        const elementWidth = 256
        const elementHeight = 300
        
        setDragConstraints({
          top: -windowHeight + elementHeight - 80,
          left: -windowWidth + elementWidth,
          right: windowWidth - elementWidth,
          bottom: windowHeight - elementHeight - 80,
        })
      }
    }
    
    updateConstraints()
    window.addEventListener('resize', updateConstraints)
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', updateConstraints)
      }
    }
  }, [])

  useEffect(() => {
    if ((isCameraEnabled && cameraStream) || cameraError) {
      setTimeout(() => {
        controls.start({ 
          opacity: 1, 
          scale: 1, 
          y: 0,
          x: 0,
          transition: { 
            type: "spring", 
            stiffness: 300, 
            damping: 30,
            duration: 0.2 
          }
        })
      }, 10)
    }
  }, [isCameraEnabled, cameraStream, cameraError, controls])

  useEffect(() => {
    if (videoRef && cameraStream) {
      videoRef.srcObject = cameraStream
      videoRef.play().catch((error) => {
        console.log('Video play failed:', error)
      })
    }
  }, [videoRef, cameraStream])

  const snapToEdge = (x: number, y: number) => {
    if (typeof window === 'undefined') return { x, y, shouldSnap: false }
    
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    const elementWidth = 256
    const elementHeight = 300
    const snapThreshold = 50
    const edgeMargin = 16
    
    let snapX = x
    let snapY = y
    let shouldSnap = false
    
    if (x <= snapThreshold) {
      snapX = -windowWidth + elementWidth + edgeMargin
      shouldSnap = true
    } else if (x >= windowWidth - elementWidth - snapThreshold) {
      snapX = windowWidth - elementWidth - edgeMargin
      shouldSnap = true
    }
    
    if (y <= snapThreshold) {
      snapY = -windowHeight + elementHeight + edgeMargin + 80
      shouldSnap = true
    } else if (y >= windowHeight - elementHeight - snapThreshold - 80) {
      snapY = windowHeight - elementHeight - edgeMargin - 80
      shouldSnap = true
    }
    
    return { x: snapX, y: snapY, shouldSnap }
  }

  return (
    <AnimatePresence>
      {((isCameraEnabled && cameraStream) || cameraError) && (
        <motion.div
          className={`fixed bottom-20 right-4 z-50 w-72 rounded-xl bg-white/95 backdrop-blur-md shadow-2xl border ${isSnapping ? 'border-blue-400/50 shadow-blue-200/50' : 'border-white/20'}`}
          drag
          dragMomentum={false}
          dragElastic={0}
          animate={controls}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          style={{
            ...((isCameraEnabled && cameraStream) || cameraError ? {
              opacity: 1,
              transform: 'translateY(0px) scale(1)'
            } : {}),
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
          }}
          onDragEnd={async (event, info) => {
            const { x, y } = info.point
            const snapResult = snapToEdge(x, y)
            
            if (snapResult.shouldSnap) {
              const animation = {
                x: snapResult.x - x,
                y: snapResult.y - y,
                scale: 1.05,
                transition: {
                  type: "spring",
                  stiffness: 400,
                  damping: 25,
                  duration: 0.3
                }
              }
              setIsSnapping(true)
              await controls.start(animation)
              setTimeout(() => {
                setIsSnapping(false)
                controls.start({ scale: 1 })
              }, 300)
            } else {
              setIsSnapping(false)
            }
          }}
        >
          <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 rounded-t-xl border-b border-gray-200/50 cursor-move backdrop-blur-sm">
            <motion.div 
              className="flex items-center gap-2"
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {cameraError ? (
                <motion.div
                  animate={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                >
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </motion.div>
              ) : (
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Camera className="h-5 w-5 text-green-600" />
                </motion.div>
              )}
              <span className="text-sm font-semibold text-gray-700">摄像头预览</span>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={onCameraToggle}
                className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600 transition-colors rounded-full"
              >
                <X className="h-3 w-3" />
              </Button>
            </motion.div>
          </div>
          <motion.div 
            className="p-3 bg-gradient-to-b from-gray-50/50 to-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {cameraError ? (
              <motion.div 
                className="text-center py-4"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                </motion.div>
                <p className="text-sm text-red-600 mb-3">{cameraError}</p>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onCameraToggle}
                    className="text-xs"
                  >
                    重试
                  </Button>
                </motion.div>
              </motion.div>
            ) : (
              <div className="relative">
                <motion.video
                  ref={setVideoRef}
                  className="w-full rounded-lg bg-black shadow-inner border border-gray-200/30"
                  style={{ aspectRatio: "16/9" }}
                  muted
                  playsInline
                  autoPlay
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                />
                <motion.div 
                  className="absolute top-2 right-2 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 px-3 py-1.5 text-xs text-white shadow-lg backdrop-blur-sm"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                >
                  <motion.div 
                    className="h-2 w-2 rounded-full bg-white"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <span className="font-medium">LIVE</span>
                </motion.div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}