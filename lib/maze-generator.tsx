import type { Cell } from "./types"

// Recursive backtracking algorithm for maze generation
export function generateMaze(width: number, height: number): Cell[][] {
  // Initialize the grid with walls
  const grid: Cell[][] = Array(height)
    .fill(null)
    .map(() =>
      Array(width)
        .fill(null)
        .map(() => ({
          visited: false,
          walls: [true, true, true, true], // top, right, bottom, left
        })),
    )

  // Helper function to get unvisited neighbors
  const getUnvisitedNeighbors = (x: number, y: number) => {
    const neighbors = []

    // Check top neighbor
    if (y > 0 && !grid[y - 1][x].visited) {
      neighbors.push({ x, y: y - 1, direction: 0, opposite: 2 })
    }
    // Check right neighbor
    if (x < width - 1 && !grid[y][x + 1].visited) {
      neighbors.push({ x: x + 1, y, direction: 1, opposite: 3 })
    }
    // Check bottom neighbor
    if (y < height - 1 && !grid[y + 1][x].visited) {
      neighbors.push({ x, y: y + 1, direction: 2, opposite: 0 })
    }
    // Check left neighbor
    if (x > 0 && !grid[y][x - 1].visited) {
      neighbors.push({ x: x - 1, y, direction: 3, opposite: 1 })
    }

    return neighbors
  }

  // Recursive function to carve paths
  const carve = (x: number, y: number) => {
    grid[y][x].visited = true

    // Get all unvisited neighbors
    let neighbors = getUnvisitedNeighbors(x, y)

    // Shuffle neighbors for randomness
    neighbors = neighbors.sort(() => Math.random() - 0.5)

    // Visit each neighbor
    for (const neighbor of neighbors) {
      if (!grid[neighbor.y][neighbor.x].visited) {
        // Remove walls between current cell and neighbor
        grid[y][x].walls[neighbor.direction] = false
        grid[neighbor.y][neighbor.x].walls[neighbor.opposite] = false

        // Recursively visit the neighbor
        carve(neighbor.x, neighbor.y)
      }
    }
  }

  // Start carving from a random position
  carve(1, 1)

  // Create entrance and exit
  grid[1][1].walls[3] = false // Left wall of (1,1)
  grid[1][0].walls[1] = false // Right wall of (0,1)

  grid[1][width - 2].walls[1] = false // Right wall of exit
  grid[1][width - 1].walls[3] = false // Left wall of outside

  return grid
}
