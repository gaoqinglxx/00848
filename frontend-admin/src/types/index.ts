export enum CellType {
  Empty = 0,
  Wall = 1,
  Floor = 2,
  Target = 3,
  Box = 4,
  Player = 5,
  BoxOnTarget = 6,
  PlayerOnTarget = 7,
  // New obstacle types
  Ice = 8,                // 冰块 - 箱子滑动
  Trap = 9,               // 陷阱 - 箱子消失
  PortalA = 10,           // 传送门A
  PortalB = 11,           // 传送门B
  OneWayDoorRight = 12,   // 单向门-向右
  OneWayDoorDown = 13,    // 单向门-向下
  OneWayDoorLeft = 14,    // 单向门-向左
  OneWayDoorUp = 15,      // 单向门-向上
  Lock = 16,              // 锁 - 需要钥匙
  Key = 17,               // 钥匙 - 可收集
  Switch = 18,            // 开关 - 切换墙壁
  SwitchWall = 19,        // 可切换的墙壁
  Hole = 20,              // 洞穴 - 填充箱子
  MagnetNorth = 21,       // 磁铁-向北吸引
  MagnetSouth = 22,       // 磁铁-向南吸引
  MagnetEast = 23,        // 磁铁-向东吸引
  MagnetWest = 24,        // 磁铁-向西吸引
  BoxOnIce = 25,          // 箱子在冰块上
  BoxOnHole = 26,         // 箱子填充洞穴
  PlayerOnIce = 27,       // 玩家在冰块上
  PlayerOnTrap = 28,      // 玩家在陷阱上
  PlayerOnPortal = 29,    // 玩家在传送门上
  PlayerOnLock = 30,      // 玩家在锁上
  PlayerOnKey = 31,       // 玩家在钥匙上
  PlayerOnSwitch = 32,    // 玩家在开关上
  PlayerOnMagnet = 33     // 玩家在磁铁上
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
