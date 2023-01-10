import { EMPTY, WALL, BLOCK, SUCCESS_BLOCK, VOID, PLAYER, levelOneMap } from './constants.js'

// Helpers
export const isBlock = (cell) => [BLOCK, SUCCESS_BLOCK].includes(cell)
export const isPlayer = (cell) => [PLAYER].includes(cell)
export const isTraversible = (cell) => [EMPTY, VOID].includes(cell)
export const isWall = (cell) => [WALL].includes(cell)
export const isVoid = (cell) => [VOID, SUCCESS_BLOCK].includes(cell)

export const getX = (x, direction, spaces = 1) => {
  if (direction === 'up' || direction === 'down') {
    return x
  }
  if (direction === 'right') {
    return x + spaces
  }
  if (direction === 'left') {
    return x - spaces
  }
}

export const getY = (y, direction, spaces = 1) => {
  if (direction === 'left' || direction === 'right') {
    return y
  }
  if (direction === 'down') {
    return y + spaces
  }
  if (direction === 'up') {
    return y - spaces
  }
}

export function generateGameBoard({ level }) {
  if (level === 1) {
    return JSON.parse(JSON.stringify(levelOneMap)) // clone deep hack
  } else if (level === "random") {
    return JSON.parse(JSON.stringify(generateRandomBoard()))
  }
}

export function countBlocks(blockCount, y, x, direction, board) {
  if (isBlock(board[y][x])) {
    blockCount++
    return countBlocks(blockCount, getY(y, direction), getX(x, direction), direction, board)
  } else {
    return blockCount
  }
}

export function generateRandomBoard() {
  const horizSize = 8;
  const vertSize = 8;
  const elements = ['WALL', 'EMPTY', 'VOID', 'BLOCK', 'PLAYER']
  let randomMap = [];
  for (let i=0; i>horizSize; i++) {
    for (let j=0; j>vertSize; j++) {
      randomMap.push(elements[Math.floor(Math.random() * elements.length)]);
    }}

  /* const randomMap = [
    [WALL, WALL, WALL, WALL, WALL, WALL, WALL, EMPTY],
    [WALL, WALL, WALL, EMPTY, EMPTY, EMPTY, WALL, EMPTY],
    [WALL, VOID, PLAYER, BLOCK, EMPTY, EMPTY, WALL, EMPTY],
    [WALL, WALL, WALL, EMPTY, BLOCK, VOID, WALL, EMPTY],
    [WALL, VOID, WALL, WALL, BLOCK, EMPTY, WALL, EMPTY],
    [WALL, EMPTY, WALL, EMPTY, VOID, EMPTY, WALL, WALL],
    [WALL, BLOCK, EMPTY, SUCCESS_BLOCK, BLOCK, BLOCK, VOID, WALL],
    [WALL, EMPTY, EMPTY, EMPTY, VOID, EMPTY, EMPTY, WALL],
    [WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL],
] */
  return randomMap
}

