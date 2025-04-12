export interface Cell {
  visited: boolean
  walls: boolean[] // [top, right, bottom, left]
}

export interface Position {
  x: number
  y: number
}
