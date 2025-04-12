"use client"

import { useState, useEffect } from "react"
import MazeGame from "@/components/maze-game"
import GameStatus from "@/components/game-status"
import { Button } from "@/components/ui/button"
import { Volume2, VolumeX } from "lucide-react"

export default function Home() {
  const [gameStarted, setGameStarted] = useState(false)
  const [gameStatus, setGameStatus] = useState<"playing" | "escaped" | "caught">("playing")
  const [timer, setTimer] = useState(0)
  const [timerActive, setTimerActive] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const [muted, setMuted] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (timerActive) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer + 1)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [timerActive])

  const startGame = () => {
    setGameStarted(true)
    setGameStatus("playing")
    setTimer(0)
    setTimerActive(true)
    setResetKey((prev) => prev + 1)
  }

  const handleGameOver = (status: "escaped" | "caught") => {
    setGameStatus(status)
    setTimerActive(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const toggleMute = () => {
    setMuted(!muted)
    // Apply mute to all audio elements
    document.querySelectorAll("audio").forEach((audio) => {
      audio.muted = !muted
    })
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-black text-gray-300">
      <div className="absolute inset-0 bg-[url('/images/dark-texture.png')] opacity-20 z-0"></div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-4xl">
        <h1 className="text-5xl font-bold mb-6 text-red-600 font-serif tracking-wider">Escape from the Labyrinth</h1>

        {/* Sound toggle button */}
        <button
          onClick={toggleMute}
          className="absolute top-0 right-0 p-2 text-gray-400 hover:text-white"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>

        {!gameStarted ? (
          <div className="text-center">
            <p className="mb-8 text-xl text-gray-400 max-w-lg">
              Navigate through the dark maze to find the exit before the Minotaur hunts you down...
            </p>
            <Button onClick={startGame} className="bg-red-900 hover:bg-red-800 text-white px-8 py-6 text-lg">
              Enter the Labyrinth
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between w-full max-w-md">
              <div className="text-lg font-medium text-red-400">
                Time Remaining: <span className="font-mono text-white">{formatTime(timer)}</span>
              </div>
              <Button onClick={startGame} variant="outline" className="border-red-800 text-red-400 hover:bg-red-900/30">
                Restart
              </Button>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-red-900/20 blur-md rounded-lg"></div>
              <div className="relative">
                <MazeGame key={resetKey} onGameOver={handleGameOver} />
                {gameStatus !== "playing" && <GameStatus status={gameStatus} time={timer} onRestart={startGame} />}
              </div>
            </div>

            <div className="mt-6 text-sm text-gray-500">
              <p>Controls: Use arrow keys or WASD to move</p>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
