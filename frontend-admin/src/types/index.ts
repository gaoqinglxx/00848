export enum CellType {
  Empty = 0,
  Wall = 1,
  Floor = 2,
  Target = 3,
  Box = 4,
  Player = 5,
  BoxOnTarget = 6,
  PlayerOnTarget = 7,
  Ice = 8,
  PressurePlate = 9,
  Door = 10,
  Key = 11,
  Lock = 12,
  OneWayRight = 13,
  OneWayLeft = 14,
  OneWayUp = 15,
  OneWayDown = 16,
  PortalA = 17,
  PortalB = 18,
  DoorOpen = 19,
  PlayerOnIce = 20,
  BoxOnIce = 21,
  PlayerOnPressurePlate = 22,
  BoxOnPressurePlate = 23,
  PlayerOnPortal = 24,
  BoxOnPortal = 25,
  PlayerOnOneWay = 26,
  BoxOnOneWay = 27
}

export interface Position {
  x: number; // Column
  y: number; // Row
}

export interface LevelData {
  id: number;
  name: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  obstacleType?: string;
  map: number[][]; // Initial raw map layout
}

export interface GameState {
  currentLevel: number;
  moves: number;
  isComplete: boolean;
  grid: CellType[][];
  playerPos: Position;
  keys: number;
  doorsOpen: Set<string>;
  pressurePlatesActive: Set<string>;
}
