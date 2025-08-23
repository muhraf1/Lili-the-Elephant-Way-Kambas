"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface ElephantCelebrationProps {
  isVisible: boolean
  onComplete: () => void
}

export function ElephantCelebration({ isVisible, onComplete }: ElephantCelebrationProps) {
  const [audioLoaded, setAudioLoaded] = useState(false)

  useEffect(() => {
    if (isVisible) {
      // Play elephant sound effect
      const audio = new Audio("/elephant-sound.mp3")
      audio.volume = 0.7

      audio.addEventListener("canplaythrough", () => setAudioLoaded(true))
      audio.addEventListener("ended", () => {
        // Animation completes when sound ends
        setTimeout(onComplete, 1000)
      })

      if (audioLoaded) {
        audio.play().catch(console.error)
      } else {
        audio.load()
        audio.play().catch(console.error)
      }

      // Fallback to complete animation if no sound
      const fallbackTimer = setTimeout(onComplete, 4000)

      return () => {
        clearTimeout(fallbackTimer)
        audio.pause()
        audio.currentTime = 0
      }
    }
  }, [isVisible, audioLoaded, onComplete])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="relative"
          >
            {/* Elephant Head Animation */}
            <motion.div
              animate={{
                y: [0, -20, 0],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
              className="text-8xl md:text-9xl"
            >
              🐘
            </motion.div>

            {/* Celebration Particles */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="absolute -top-4 -left-4 text-4xl"
            >
              <motion.span
                animate={{
                  rotate: 360,
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                }}
              >
                ✨
              </motion.span>
            </motion.div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="absolute -top-2 -right-6 text-3xl"
            >
              <motion.span
                animate={{
                  rotate: -360,
                  scale: [1, 1.3, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Number.POSITIVE_INFINITY,
                }}
              >
                🎉
              </motion.span>
            </motion.div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="absolute -bottom-2 -left-6 text-3xl"
            >
              <motion.span
                animate={{
                  rotate: 360,
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Number.POSITIVE_INFINITY,
                }}
              >
                💚
              </motion.span>
            </motion.div>
          </motion.div>

          {/* Thank You Message */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="absolute bottom-1/3 text-center"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Thank You! 🙏</h2>
            <p className="text-lg text-white/90">Your donation helps save elephants at Way Kambas!</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
