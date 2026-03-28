import { ref, computed } from 'vue';
import { CellType, type GameState, type Position } from '@/types';
import { levels } from '@/data/levels';
import { ElMessage } from 'element-plus';

interface HistoryState {
  grid: CellType[][];
  playerPos: Position;
  moves: number;
  keys: number;
  doorsOpen: string[];
  pressurePlatesActive: string[];
}

export function useSokoban() {
  const currentLevelIndex = ref(0);
  const gameState = ref<GameState>({
    currentLevel: 1,
    moves: 0,
    isComplete: false,
    grid: [],
    playerPos: { x: 0, y: 0 },
    keys: 0,
    doorsOpen: new Set(),
    pressurePlatesActive: new Set()
  });

  const history = ref<HistoryState[]>([]);

  const saveToHistory = () => {
    history.value.push({
      grid: JSON.parse(JSON.stringify(gameState.value.grid)),
      playerPos: { ...gameState.value.playerPos },
      moves: gameState.value.moves,
      keys: gameState.value.keys,
      doorsOpen: Array.from(gameState.value.doorsOpen),
      pressurePlatesActive: Array.from(gameState.value.pressurePlatesActive)
    });
  };

  const initLevel = (index: number) => {
    if (index < 0 || index >= levels.length) return;
    
    const level = levels[index];
    currentLevelIndex.value = index;
    gameState.value.currentLevel = level.id;
    gameState.value.moves = 0;
    gameState.value.isComplete = false;
    gameState.value.keys = 0;
    gameState.value.doorsOpen = new Set();
    gameState.value.pressurePlatesActive = new Set();
    history.value = [];

    const rawMap = level.map;
    const newGrid: CellType[][] = [];
    
    for (let y = 0; y < rawMap.length; y++) {
      const row: CellType[] = [];
      for (let x = 0; x < rawMap[y].length; x++) {
        const cell = rawMap[y][x];
        if (cell === 5) {
          gameState.value.playerPos = { x, y };
          row.push(CellType.Floor);
        } else if (cell === 4) {
          row.push(CellType.Box);
        } else {
          row.push(cell);
        }
      }
      newGrid.push(row);
    }
    gameState.value.grid = newGrid;
    
    updatePressurePlates();
  };

  const updatePressurePlates = () => {
    const staticMap = levels[currentLevelIndex.value].map;
    gameState.value.pressurePlatesActive.clear();
    
    for (let y = 0; y < staticMap.length; y++) {
      for (let x = 0; x < staticMap[y].length; x++) {
        if (staticMap[y][x] === CellType.PressurePlate) {
          const currentCell = gameState.value.grid[y][x];
          const isPlayerOnPlate = gameState.value.playerPos.x === x && gameState.value.playerPos.y === y;
          if (currentCell === CellType.Box || currentCell === CellType.BoxOnTarget || isPlayerOnPlate) {
            gameState.value.pressurePlatesActive.add(`${x},${y}`);
          }
        }
      }
    }
    
    updateDoors();
  };

  const updateDoors = () => {
    const staticMap = levels[currentLevelIndex.value].map;
    gameState.value.doorsOpen.clear();
    
    for (let y = 0; y < staticMap.length; y++) {
      for (let x = 0; x < staticMap[y].length; x++) {
        if (staticMap[y][x] === CellType.Door) {
          const hasActivePlate = Array.from(gameState.value.pressurePlatesActive).some(platePos => {
            const [px, py] = platePos.split(',').map(Number);
            return Math.abs(px - x) <= 3 && Math.abs(py - y) <= 3;
          });
          
          if (hasActivePlate || gameState.value.pressurePlatesActive.size > 0) {
            gameState.value.doorsOpen.add(`${x},${y}`);
          }
        }
      }
    }
  };

  const checkWin = () => {
    const staticMap = levels[currentLevelIndex.value].map;
    let allTargetsCovered = true;

    for (let y = 0; y < staticMap.length; y++) {
      for (let x = 0; x < staticMap[y].length; x++) {
        if (staticMap[y][x] === CellType.Target) {
          const currentCell = gameState.value.grid[y][x];
          if (currentCell !== CellType.Box && currentCell !== CellType.BoxOnTarget) {
            allTargetsCovered = false;
          }
        }
      }
    }

    if (allTargetsCovered && !gameState.value.isComplete) {
      gameState.value.isComplete = true;
      ElMessage.success('恭喜你！挑战成功！');
    }
  };

  const canMoveTo = (x: number, y: number, dx: number, dy: number, isBox: boolean = false): boolean => {
    if (x < 0 || y < 0 || y >= gameState.value.grid.length || x >= gameState.value.grid[0].length) {
      return false;
    }

    const targetCell = gameState.value.grid[y][x];
    const staticMap = levels[currentLevelIndex.value].map;
    const staticCell = staticMap[y]?.[x];

    if (targetCell === CellType.Wall || staticCell === CellType.Wall) {
      return false;
    }

    if (staticCell === CellType.Door && !gameState.value.doorsOpen.has(`${x},${y}`)) {
      return false;
    }

    if (staticCell === CellType.Lock && gameState.value.keys === 0) {
      return false;
    }

    if (isBox) {
      if (targetCell === CellType.Box || targetCell === CellType.BoxOnTarget) {
        return false;
      }
    }

    return true;
  };

  const checkOneWay = (x: number, y: number, dx: number, dy: number): boolean => {
    const staticMap = levels[currentLevelIndex.value].map;
    const staticCell = staticMap[y]?.[x];

    if (staticCell === CellType.OneWayRight && dx !== 1) return false;
    if (staticCell === CellType.OneWayLeft && dx !== -1) return false;
    if (staticCell === CellType.OneWayUp && dy !== -1) return false;
    if (staticCell === CellType.OneWayDown && dy !== 1) return false;

    return true;
  };

  const handleTeleport = (x: number, y: number): Position | null => {
    const staticMap = levels[currentLevelIndex.value].map;
    const staticCell = staticMap[y]?.[x];

    if (staticCell !== CellType.PortalA && staticCell !== CellType.PortalB) {
      return null;
    }

    const targetPortal = staticCell === CellType.PortalA ? CellType.PortalB : CellType.PortalA;

    for (let py = 0; py < staticMap.length; py++) {
      for (let px = 0; px < staticMap[py].length; px++) {
        if (staticMap[py][px] === targetPortal && (px !== x || py !== y)) {
          return { x: px, y: py };
        }
      }
    }

    return null;
  };

  const move = (dx: number, dy: number) => {
    if (gameState.value.isComplete) return;

    const { x, y } = gameState.value.playerPos;
    const newX = x + dx;
    const newY = y + dy;

    if (!checkOneWay(newX, newY, dx, dy)) {
      return;
    }

    if (!canMoveTo(newX, newY, dx, dy)) {
      return;
    }

    saveToHistory();

    const targetCell = gameState.value.grid[newY][newX];
    const staticMap = levels[currentLevelIndex.value].map;

    if (staticMap[newY]?.[newX] === CellType.Key) {
      gameState.value.keys++;
      gameState.value.grid[newY][newX] = CellType.Floor;
    }

    if (staticMap[newY]?.[newX] === CellType.Lock && gameState.value.keys > 0) {
      gameState.value.keys--;
      gameState.value.grid[newY][newX] = CellType.Floor;
    }

    if (targetCell === CellType.Box || targetCell === CellType.BoxOnTarget) {
      const boxNewX = newX + dx;
      const boxNewY = newY + dy;

      if (!canMoveTo(boxNewX, boxNewY, dx, dy, true)) {
        history.value.pop();
        return;
      }

      const boxTargetCell = gameState.value.grid[boxNewY][boxNewX];
      const isBoxTarget = staticMap[boxNewY]?.[boxNewX] === CellType.Target;

      if (boxTargetCell === CellType.Floor || boxTargetCell === CellType.PressurePlate || 
          boxTargetCell === CellType.Ice || boxTargetCell === CellType.Target ||
          staticMap[boxNewY]?.[boxNewX] === CellType.PressurePlate ||
          staticMap[boxNewY]?.[boxNewX] === CellType.Ice) {
        if (isBoxTarget) {
          gameState.value.grid[boxNewY][boxNewX] = CellType.BoxOnTarget;
        } else {
          gameState.value.grid[boxNewY][boxNewX] = CellType.Box;
        }

        const wasOnTarget = staticMap[newY]?.[newX] === CellType.Target;
        if (wasOnTarget) {
          gameState.value.grid[newY][newX] = CellType.Target;
        } else if (staticMap[newY]?.[newX] === CellType.PressurePlate) {
          gameState.value.grid[newY][newX] = CellType.PressurePlate;
        } else if (staticMap[newY]?.[newX] === CellType.Ice) {
          gameState.value.grid[newY][newX] = CellType.Ice;
        } else {
          gameState.value.grid[newY][newX] = CellType.Floor;
        }
      }
    }

    gameState.value.playerPos = { x: newX, y: newY };
    gameState.value.moves++;

    updatePressurePlates();

    const teleportPos = handleTeleport(newX, newY);
    if (teleportPos) {
      gameState.value.playerPos = teleportPos;
    }

    if (staticMap[newY]?.[newX] === CellType.Ice || staticMap[teleportPos?.y ?? -1]?.[teleportPos?.x ?? -1] === CellType.Ice) {
      slideOnIce(dx, dy);
    }

    checkWin();
  };

  const slideOnIce = (dx: number, dy: number) => {
    let { x, y } = gameState.value.playerPos;
    const staticMap = levels[currentLevelIndex.value].map;

    while (true) {
      const nextX = x + dx;
      const nextY = y + dy;

      if (!canMoveTo(nextX, nextY, dx, dy)) {
        break;
      }

      const targetCell = gameState.value.grid[nextY][nextX];
      if (targetCell === CellType.Box || targetCell === CellType.BoxOnTarget) {
        break;
      }

      x = nextX;
      y = nextY;

      if (staticMap[nextY]?.[nextX] !== CellType.Ice) {
        break;
      }
    }

    gameState.value.playerPos = { x, y };
  };

  const undo = () => {
    if (history.value.length === 0) {
      ElMessage.info('没有可撤销的操作');
      return;
    }

    const previousState = history.value.pop()!;
    gameState.value.grid = previousState.grid;
    gameState.value.playerPos = previousState.playerPos;
    gameState.value.moves = previousState.moves;
    gameState.value.keys = previousState.keys;
    gameState.value.doorsOpen = new Set(previousState.doorsOpen);
    gameState.value.pressurePlatesActive = new Set(previousState.pressurePlatesActive);
    gameState.value.isComplete = false;
  };

  const reset = () => {
    initLevel(currentLevelIndex.value);
    ElMessage.info('游戏已重置');
  };

  return {
    gameState,
    levels,
    initLevel,
    move,
    undo,
    reset
  };
}
