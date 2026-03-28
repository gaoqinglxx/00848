export enum CellType {
  Empty = 0,
  Wall = 1,
  Floor = 2,
  Target = 3,
  Box = 4,
  Player = 5,
  BoxOnTarget = 6,
  PlayerOnTarget = 7
}

export interface Position {
  x: number; // Column
  y: number; // Row
}

export interface LevelData {
  id: number;
  name: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  map: number[][]; // Initial raw map layout
}

export interface GameState {
  currentLevel: number;
  moves: number;
  isComplete: boolean;
  grid: CellType[][];
  playerPos: Position;
}
