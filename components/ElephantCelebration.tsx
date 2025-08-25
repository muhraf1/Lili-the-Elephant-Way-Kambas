"use client"

import { useEffect } from "react"

interface ElephantCelebrationProps {
  isVisible: boolean
  onComplete: () => void
}

export function ElephantCelebration({ isVisible, onComplete }: ElephantCelebrationProps) {
  useEffect(() => {
    if (!isVisible) return

    const audio = new Audio()
    audio.volume = 0.7

    let completed = false

    const complete = () => {
      if (completed) return
      completed = true
      setTimeout(onComplete, 1000)
    }

    const tryPlay = async (srcs: string[]) => {
      for (const src of srcs) {
        try {
          audio.src = src
          // Some browsers need load before play when swapping src
          audio.load()
          await audio.play()
          return true
        } catch (err) {
          // Try next source
        }
      }
      return false
    }

    audio.addEventListener("ended", complete)

    // Attempt MP3 first, then fall back to the existing MP4 asset in public/
    // After a donation, user interaction should have occurred, so autoplay should be allowed.
    void tryPlay(["/elephant-sound.mp3", "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/git-blob/prj_HkbJ1vD54eFIDtMrTeFnMLyi9pMM/1Rl3OmnCwv9QbFtzevBlFv/public/ELEPHANT%20-%20Sound%20Effect.mp4"]).then((played) => {
      if (!played) {
        // If neither source could play, still show the celebration briefly
        setTimeout(complete, 2000)
      }
    })

    // Safety timeout to avoid hanging if no events fire
    const safetyTimeout = setTimeout(complete, 8000)

    return () => {
      clearTimeout(safetyTimeout)
      audio.pause()
      audio.src = ""
    }
  }, [isVisible, onComplete])

  return (
    isVisible ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="relative">
          <div className="text-8xl md:text-9xl animate-bounce">
            🐘
          </div>

          <div className="absolute -top-4 -left-4 text-4xl animate-spin-slow">
            <span className="inline-block animate-pulse">✨</span>
          </div>

          <div className="absolute -top-2 -right-6 text-3xl animate-spin-slow reverse">
            <span className="inline-block animate-pulse">🎉</span>
          </div>

          <div className="absolute -bottom-2 -left-6 text-3xl animate-spin-slower">
            <span className="inline-block animate-pulse">💚</span>
          </div>
        </div>

        <div className="absolute bottom-1/3 text-center animate-in slide-in-from-bottom-4 fade-in duration-500 delay-200">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Thank You! 🙏</h2>
          <p className="text-lg text-white/90">Your donation helps save elephants at Way Kambas!</p>
        </div>
      </div>
    ) : null
  )
}
