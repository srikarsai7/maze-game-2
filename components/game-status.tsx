"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

interface GameStatusProps {
  status: "escaped" | "caught"
  time: number
  onRestart: () => void
}

export default function GameStatus({ status, time, onRestart }: GameStatusProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className={`bg-gray-900 p-8 rounded-lg shadow-2xl text-center border ${
          status === "escaped" ? "border-green-700" : "border-red-900"
        }`}
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 12 }}
      >
        {status === "escaped" ? (
          <>
            <h2 className="text-3xl font-bold text-green-500 mb-4">Freedom at Last!</h2>
            <p className="mb-6 text-lg text-gray-300">
              You escaped the labyrinth in <span className="font-mono font-bold text-white">{formatTime(time)}</span>!
            </p>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-bold text-red-600 mb-4">The Minotaur Claims Another Victim</h2>
            <p className="mb-6 text-lg text-gray-300">
              You survived for <span className="font-mono font-bold text-white">{formatTime(time)}</span> before being
              caught.
            </p>
          </>
        )}
        <Button
          onClick={onRestart}
          className={`${
            status === "escaped" ? "bg-green-900 hover:bg-green-800" : "bg-red-900 hover:bg-red-800"
          } text-white px-6 py-2 text-lg`}
        >
          {status === "escaped" ? "Challenge Again" : "Try Again"}
        </Button>
      </motion.div>
    </motion.div>
  )
}
