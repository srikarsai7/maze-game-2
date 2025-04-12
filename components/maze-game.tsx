"use client"

import { useRef, useEffect, useState } from "react"
import { generateMaze } from "@/lib/maze-generator"
import type { Cell, Position } from "@/lib/types"
import Image from "next/image"
import { useAudio } from "@/hooks/use-audio"

interface MazeGameProps {
  onGameOver: (status: "escaped" | "caught") => void
}

const CELL_SIZE = 45 // Increased from 30 to 45
const MAZE_WIDTH = 15
const MAZE_HEIGHT = 15

export default function MazeGame({ onGameOver }: MazeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [maze, setMaze] = useState<Cell[][]>([])
  const [playerPos, setPlayerPos] = useState<Position>({ x: 1, y: 1 })
  const [minotaurPos, setMinotaurPos] = useState<Position>({ x: MAZE_WIDTH - 2, y: MAZE_HEIGHT - 2 })
  const [exitPos, setExitPos] = useState<Position>({ x: MAZE_WIDTH - 2, y: 1 })
  const [isInitialized, setIsInitialized] = useState(false)
  const requestRef = useRef<number>()
  const lastMinotaurMoveRef = useRef<number>(0)
  const difficultyRef = useRef<number>(0.7) // Difficulty factor: 0 = random, 1 = perfect pathfinding
  const lastMinotaurGrowlRef = useRef<number>(0)

  // Audio hooks
  const { play: playBackgroundMusic, stop: stopBackgroundMusic } = useAudio("/audio/background.mp3", {
    loop: true,
    volume: 0.3,
  })
  const { play: playPlayerMove } = useAudio("/audio/player-move.mp3", { volume: 0.4 })
  const { play: playMinotaurGrowl } = useAudio("/audio/minotaur-growl.mp3", { volume: 0.5 })
  const { play: playWin } = useAudio("/audio/win.mp3", { volume: 0.6 })
  const { play: playLose } = useAudio("/audio/lose.mp3", { volume: 0.6 })

  // Start background music when game initializes
  useEffect(() => {
    if (isInitialized) {
      playBackgroundMusic()
    }
    return () => {
      stopBackgroundMusic()
    }
  }, [isInitialized, playBackgroundMusic, stopBackgroundMusic])

  // Initialize the maze
  useEffect(() => {
    const newMaze = generateMaze(MAZE_WIDTH, MAZE_HEIGHT)
    setMaze(newMaze)
    setPlayerPos({ x: 1, y: 1 })
    setMinotaurPos({ x: MAZE_WIDTH - 2, y: MAZE_HEIGHT - 2 })
    setExitPos({ x: MAZE_WIDTH - 2, y: 1 })
    setIsInitialized(true)
  }, [])

  // Handle keyboard input
  useEffect(() => {
    if (!isInitialized || maze.length === 0) return

    const handleKeyDown = (e: KeyboardEvent) => {
      let newX = playerPos.x
      let newY = playerPos.y
      let moved = false

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          newY--
          break
        case "ArrowDown":
        case "s":
        case "S":
          newY++
          break
        case "ArrowLeft":
        case "a":
        case "A":
          newX--
          break
        case "ArrowRight":
        case "d":
        case "D":
          newX++
          break
        default:
          return
      }

      // Check if the new position is valid (not a wall)
      if (newX >= 0 && newX < MAZE_WIDTH && newY >= 0 && newY < MAZE_HEIGHT) {
        // Check if there's a wall between current position and new position
        if (newX < playerPos.x && !maze[playerPos.y][playerPos.x].walls[3]) {
          // Moving left
          setPlayerPos({ x: newX, y: newY })
          moved = true
        } else if (newX > playerPos.x && !maze[playerPos.y][playerPos.x].walls[1]) {
          // Moving right
          setPlayerPos({ x: newX, y: newY })
          moved = true
        } else if (newY < playerPos.y && !maze[playerPos.y][playerPos.x].walls[0]) {
          // Moving up
          setPlayerPos({ x: newX, y: newY })
          moved = true
        } else if (newY > playerPos.y && !maze[playerPos.y][playerPos.x].walls[2]) {
          // Moving down
          setPlayerPos({ x: newX, y: newY })
          moved = true
        }

        // Play movement sound if moved
        if (moved) {
          playPlayerMove()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [playerPos, maze, isInitialized, playPlayerMove])

  // Game loop
  const gameLoop = (timestamp: number) => {
    if (!isInitialized || maze.length === 0) {
      requestRef.current = requestAnimationFrame(gameLoop)
      return
    }

    // Move minotaur every 500ms
    if (timestamp - lastMinotaurMoveRef.current > 500) {
      moveMinotaur()
      lastMinotaurMoveRef.current = timestamp
    }

    // Play minotaur growl occasionally
    if (timestamp - lastMinotaurGrowlRef.current > 5000 && Math.random() > 0.7) {
      playMinotaurGrowl()
      lastMinotaurGrowlRef.current = timestamp
    }

    // Check win/lose conditions
    if (playerPos.x === exitPos.x && playerPos.y === exitPos.y) {
      stopBackgroundMusic()
      playWin()
      onGameOver("escaped")
      return
    }

    if (playerPos.x === minotaurPos.x && playerPos.y === minotaurPos.y) {
      stopBackgroundMusic()
      playLose()
      onGameOver("caught")
      return
    }

    requestRef.current = requestAnimationFrame(gameLoop)
  }

  useEffect(() => {
    requestRef.current = requestAnimationFrame(gameLoop)
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [playerPos, minotaurPos, exitPos, isInitialized, maze])

  // Check if a move from one position to another is valid (no wall between them)
  const isValidMove = (from: Position, to: Position): boolean => {
    // Check if the positions are adjacent
    const dx = to.x - from.x
    const dy = to.y - from.y

    // Only allow moves to adjacent cells
    if (Math.abs(dx) + Math.abs(dy) !== 1) return false

    // Check if there's a wall between the cells
    if (dx === 1) {
      // Moving right
      return !maze[from.y][from.x].walls[1]
    } else if (dx === -1) {
      // Moving left
      return !maze[from.y][from.x].walls[3]
    } else if (dy === 1) {
      // Moving down
      return !maze[from.y][from.x].walls[2]
    } else if (dy === -1) {
      // Moving up
      return !maze[from.y][from.x].walls[0]
    }

    return false
  }

  // Find the shortest path from minotaur to player using BFS
  const findPathToPlayer = (): Position[] => {
    // Queue for BFS
    const queue: { pos: Position; path: Position[] }[] = [{ pos: minotaurPos, path: [] }]
    // Keep track of visited cells
    const visited: boolean[][] = Array(MAZE_HEIGHT)
      .fill(null)
      .map(() => Array(MAZE_WIDTH).fill(false))

    visited[minotaurPos.y][minotaurPos.x] = true

    while (queue.length > 0) {
      const { pos, path } = queue.shift()!

      // If we found the player, return the path
      if (pos.x === playerPos.x && pos.y === playerPos.y) {
        return path
      }

      // Check all four directions
      const directions = [
        { x: 0, y: -1 }, // up
        { x: 1, y: 0 }, // right
        { x: 0, y: 1 }, // down
        { x: -1, y: 0 }, // left
      ]

      for (const dir of directions) {
        const newPos = { x: pos.x + dir.x, y: pos.y + dir.y }

        // Check if the new position is valid and not visited
        if (
          newPos.x >= 0 &&
          newPos.x < MAZE_WIDTH &&
          newPos.y >= 0 &&
          newPos.y < MAZE_HEIGHT &&
          !visited[newPos.y][newPos.x] &&
          isValidMove(pos, newPos)
        ) {
          visited[newPos.y][newPos.x] = true
          queue.push({
            pos: newPos,
            path: [...path, newPos],
          })
        }
      }
    }

    // If no path is found, return an empty array
    return []
  }

  // Move the minotaur
  const moveMinotaur = () => {
    if (!isInitialized || maze.length === 0) return

    // Use BFS to find the shortest path to the player
    const path = findPathToPlayer()

    if (path.length > 0) {
      // Decide whether to follow the optimal path or move randomly
      if (Math.random() < difficultyRef.current) {
        // Follow the optimal path
        setMinotaurPos(path[0])

        // Play growl when minotaur is getting close to player
        if (path.length < 3) {
          playMinotaurGrowl()
        }
      } else {
        // Move randomly
        const directions = [
          { x: 0, y: -1, wallIdx: 0 }, // up
          { x: 1, y: 0, wallIdx: 1 }, // right
          { x: 0, y: 1, wallIdx: 2 }, // down
          { x: -1, y: 0, wallIdx: 3 }, // left
        ]

        // Shuffle directions
        for (let i = directions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[directions[i], directions[j]] = [directions[j], directions[i]]
        }

        // Try each direction until a valid move is found
        for (const dir of directions) {
          const newX = minotaurPos.x + dir.x
          const newY = minotaurPos.y + dir.y

          if (
            newX >= 0 &&
            newX < MAZE_WIDTH &&
            newY >= 0 &&
            newY < MAZE_HEIGHT &&
            !maze[minotaurPos.y][minotaurPos.x].walls[dir.wallIdx]
          ) {
            setMinotaurPos({ x: newX, y: newY })
            break
          }
        }
      }
    }
  }

  // Render the maze
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || maze.length === 0) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Fill background with dark color
    ctx.fillStyle = "#0a0a0a"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw maze
    ctx.strokeStyle = "#4a0404" // Dark blood red for walls
    ctx.lineWidth = 3 // Thicker walls

    for (let y = 0; y < MAZE_HEIGHT; y++) {
      for (let x = 0; x < MAZE_WIDTH; x++) {
        const cell = maze[y][x]
        const cellX = x * CELL_SIZE
        const cellY = y * CELL_SIZE

        // Draw walls
        if (cell.walls[0]) {
          // Top
          ctx.beginPath()
          ctx.moveTo(cellX, cellY)
          ctx.lineTo(cellX + CELL_SIZE, cellY)
          ctx.stroke()
        }
        if (cell.walls[1]) {
          // Right
          ctx.beginPath()
          ctx.moveTo(cellX + CELL_SIZE, cellY)
          ctx.lineTo(cellX + CELL_SIZE, cellY + CELL_SIZE)
          ctx.stroke()
        }
        if (cell.walls[2]) {
          // Bottom
          ctx.beginPath()
          ctx.moveTo(cellX, cellY + CELL_SIZE)
          ctx.lineTo(cellX + CELL_SIZE, cellY + CELL_SIZE)
          ctx.stroke()
        }
        if (cell.walls[3]) {
          // Left
          ctx.beginPath()
          ctx.moveTo(cellX, cellY)
          ctx.lineTo(cellX, cellY + CELL_SIZE)
          ctx.stroke()
        }
      }
    }

    // Draw exit - glowing green portal
    const exitGradient = ctx.createRadialGradient(
      exitPos.x * CELL_SIZE + CELL_SIZE / 2,
      exitPos.y * CELL_SIZE + CELL_SIZE / 2,
      2,
      exitPos.x * CELL_SIZE + CELL_SIZE / 2,
      exitPos.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 1.5,
    )
    exitGradient.addColorStop(0, "#50ff50")
    exitGradient.addColorStop(0.7, "#00800050")
    exitGradient.addColorStop(1, "transparent")

    ctx.fillStyle = exitGradient
    ctx.beginPath()
    ctx.arc(exitPos.x * CELL_SIZE + CELL_SIZE / 2, exitPos.y * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE / 2, 0, Math.PI * 2)
    ctx.fill()
  }, [maze, playerPos, minotaurPos, exitPos])

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={MAZE_WIDTH * CELL_SIZE}
        height={MAZE_HEIGHT * CELL_SIZE}
        className="border border-red-900 shadow-[0_0_15px_rgba(220,38,38,0.3)] bg-black rounded-sm"
      />

      {/* Player image */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: `${playerPos.x * CELL_SIZE}px`,
          top: `${playerPos.y * CELL_SIZE}px`,
          width: `${CELL_SIZE * 1.2}px`, // Increased size
          height: `${CELL_SIZE * 1.2}px`, // Increased size
          transform: "translate(-10%, -10%)", // Center the larger image
          transition: "left 0.2s, top 0.2s",
          filter: "drop-shadow(0 0 5px rgba(255, 255, 255, 0.7))",
        }}
      >
        <Image
          src="/images/player.png"
          alt="Player"
          width={CELL_SIZE * 1.2}
          height={CELL_SIZE * 1.2}
          className="object-contain"
          priority
        />
      </div>

      {/* Minotaur image */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: `${minotaurPos.x * CELL_SIZE - CELL_SIZE / 3}px`,
          top: `${minotaurPos.y * CELL_SIZE - CELL_SIZE / 3}px`,
          width: `${CELL_SIZE * 1.8}px`, // Increased size
          height: `${CELL_SIZE * 1.8}px`, // Increased size
          transition: "left 0.2s, top 0.2s",
          filter: "drop-shadow(0 0 8px rgba(255, 0, 0, 0.7))",
        }}
      >
        <Image
          src="/images/minotaur.png"
          alt="Minotaur"
          width={CELL_SIZE * 1.8}
          height={CELL_SIZE * 1.8}
          className="object-contain"
          priority
        />
      </div>
    </div>
  )
}
