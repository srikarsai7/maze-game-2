"use client"

import { useRef, useEffect, useCallback } from "react"

interface AudioOptions {
  volume?: number
  loop?: boolean
}

export function useAudio(src: string, options: AudioOptions = {}) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { volume = 1, loop = false } = options

  useEffect(() => {
    // Create audio element only on client side
    if (typeof window !== "undefined") {
      const audio = new Audio(src)
      audio.volume = volume
      audio.loop = loop
      audioRef.current = audio

      return () => {
        audio.pause()
        audio.src = ""
      }
    }
  }, [src, volume, loop])

  const play = useCallback(() => {
    if (audioRef.current) {
      // Reset the audio to the beginning if it's already playing
      audioRef.current.currentTime = 0

      // Use the play() method and handle any errors
      const playPromise = audioRef.current.play()

      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error("Audio play error:", error)
        })
      }
    }
  }, [])

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }, [])

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
  }, [])

  return { play, stop, pause }
}
