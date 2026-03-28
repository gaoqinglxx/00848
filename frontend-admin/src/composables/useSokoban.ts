import { ref, computed } from 'vue';
import { CellType, type GameState, type Position } from '@/types';
import { levels } from '@/data/levels';
import { ElMessage } from 'element-plus';

export function useSokoban() {
  const currentLevelIndex = ref(0);
  const gameState = ref<GameState>({
    currentLevel: 1,
    moves: 0,
    isComplete: false,
    grid: [],
    playerPos: { x: 0, y: 0 }
  });

  // History stack for Undo
  const history = ref<string[]>([]);
  
  // Game state for obstacles
  const collectedKeys = ref(0);
  const switchActivated = ref(false);

  const initLevel = (index: number) => {
    const level = levels[index];
    if (!level) return;

    currentLevelIndex.value = index;
    gameState.value.currentLevel = level.id;
    gameState.value.moves = 0;
    gameState.value.isComplete = false;
    history.value = [];
    collectedKeys.value = 0;
    switchActivated.value = false;

    // Deep copy and parse map
    const rawMap = level.map;
    const newGrid: CellType[][] = [];

    for (let y = 0; y < rawMap.length; y++) {
      const row: CellType[] = [];
      for (let x = 0; x < rawMap[y].length; x++) {
        const cell = rawMap[y][x];
        if (cell === 5) { // Player
          gameState.value.playerPos = { x, y };
          row.push(CellType.Floor); // Player stands on floor
        } else if (cell === 4) { // Box
          row.push(CellType.Box);
        } else {
          row.push(cell);
        }
      }
      newGrid.push(row);
    }
    gameState.value.grid = newGrid;
  };

  const checkWin = () => {
    // Check if all Targets have Boxes
    // In our simplified grid, we need to know where targets are.
    // However, the grid changes state.
    // Let's rely on the static map for target locations to check against current grid state.

    const staticMap = levels[currentLevelIndex.value].map;
    let allTargetsCovered = true;

    for (let y = 0; y < staticMap.length; y++) {
      for (let x = 0; x < staticMap[y].length; x++) {
        if (staticMap[y][x] === CellType.Target) {
          // If the current grid at this pos is NOT Box or BoxOnTarget
          // Note: Logic below handles state updates.
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

  // Helper: Find portal pair
  const findPortalPair = (portalType: CellType): Position | null => {
    const pairType = portalType === CellType.PortalA ? CellType.PortalB : CellType.PortalA;
    for (let y = 0; y < gameState.value.grid.length; y++) {
      for (let x = 0; x < gameState.value.grid[y].length; x++) {
        if (gameState.value.grid[y][x] === pairType) {
          return { x, y };
        }
      }
    }
    return null;
  };

  // Helper: Handle ice sliding
  const handleIceSlide = (x: number, y: number, dx: number, dy: number, isBox: boolean = false): Position | null => {
    let slideX = x + dx;
    let slideY = y + dy;
    
    while (true) {
      // Check bounds
      if (slideY < 0 || slideY >= gameState.value.grid.length || 
          slideX < 0 || slideX >= gameState.value.grid[0].length) {
        return { x: slideX - dx, y: slideY - dy };
      }
      
      const cell = gameState.value.grid[slideY][slideX];
      
      // Check if cell is walkable
      const isWalkable = [CellType.Floor, CellType.Target, CellType.Empty, CellType.Ice].includes(cell);
      
      if (!isWalkable) {
        // Check if it's a box
        if (cell === CellType.Box || cell === CellType.BoxOnTarget || cell === CellType.BoxOnIce) {
          // Try to push the box
          const boxNextX = slideX + dx;
          const boxNextY = slideY + dy;
          
          if (boxNextY >= 0 && boxNextY < gameState.value.grid.length &&
              boxNextX >= 0 && boxNextX < gameState.value.grid[0].length) {
            const boxNextCell = gameState.value.grid[boxNextY][boxNextX];
            const canPushBox = [CellType.Floor, CellType.Target, CellType.Empty, CellType.Ice].includes(boxNextCell);
            
            if (canPushBox) {
              // Update box position
              gameState.value.grid[boxNextY][boxNextX] = boxNextCell === CellType.Ice ? CellType.BoxOnIce : 
                boxNextCell === CellType.Target ? CellType.BoxOnTarget : CellType.Box;
              gameState.value.grid[slideY][slideX] = cell === CellType.BoxOnIce ? CellType.Ice : 
                cell === CellType.BoxOnTarget ? CellType.Target : CellType.Floor;
            } else {
              return { x: slideX - dx, y: slideY - dy };
            }
          } else {
            return { x: slideX - dx, y: slideY - dy };
          }
        } else {
          return { x: slideX - dx, y: slideY - dy };
        }
      }
      
      // Check if reached non-ice cell
      if (cell !== CellType.Ice) {
        return { x: slideX, y: slideY };
      }
      
      // Continue sliding
      slideX += dx;
      slideY += dy;
    }
  };

  const move = (dx: number, dy: number) => {
    if (gameState.value.isComplete) return;

    const { x, y } = gameState.value.playerPos;
    const newX = x + dx;
    const newY = y + dy;

    // Bounds check
    if (newY < 0 || newY >= gameState.value.grid.length || newX < 0 || newX >= gameState.value.grid[0].length) return;

    const targetCell = gameState.value.grid[newY][newX];

    // 1. Basic obstacles check
    const basicObstacles = [CellType.Wall];
    if (basicObstacles.includes(targetCell)) return;

    // 2. Switch wall check
    if (targetCell === CellType.SwitchWall && !switchActivated.value) return;

    // 3. One-way door check
    if (targetCell === CellType.OneWayDoorRight && dx !== 1) return;
    if (targetCell === CellType.OneWayDoorDown && dy !== 1) return;
    if (targetCell === CellType.OneWayDoorLeft && dx !== -1) return;
    if (targetCell === CellType.OneWayDoorUp && dy !== -1) return;

    // 4. Lock check
    if (targetCell === CellType.Lock && collectedKeys.value === 0) return;

    // Save state for undo
    const stateSnapshot = JSON.stringify({
      grid: gameState.value.grid,
      playerPos: gameState.value.playerPos,
      moves: gameState.value.moves,
      collectedKeys: collectedKeys.value,
      switchActivated: switchActivated.value
    });

    // Handle special cells
    let finalX = newX;
    let finalY = newY;
    let moved = false;

    // Key collection
    if (targetCell === CellType.Key) {
      collectedKeys.value++;
      gameState.value.grid[newY][newX] = CellType.Floor;
      moved = true;
    }

    // Lock unlocking
    if (targetCell === CellType.Lock && collectedKeys.value > 0) {
      collectedKeys.value--;
      gameState.value.grid[newY][newX] = CellType.Floor;
      moved = true;
    }

    // Switch activation
    if (targetCell === CellType.Switch) {
      switchActivated.value = !switchActivated.value;
      moved = true;
    }

    // Portal handling
    if (targetCell === CellType.PortalA || targetCell === CellType.PortalB) {
      const portalPair = findPortalPair(targetCell);
      if (portalPair) {
        finalX = portalPair.x;
        finalY = portalPair.y;
        moved = true;
      }
    }

    // Ice handling
    if (targetCell === CellType.Ice) {
      const slideResult = handleIceSlide(newX, newY, dx, dy, false);
      if (slideResult) {
        finalX = slideResult.x;
        finalY = slideResult.y;
        moved = true;
      }
    }

    // Magnet handling (simple version - pull boxes in direction)
    const magnetTypes = [CellType.MagnetNorth, CellType.MagnetSouth, CellType.MagnetEast, CellType.MagnetWest];
    if (magnetTypes.includes(targetCell)) {
      // For simplicity, just move player and handle magnet effect on next move
      moved = true;
    }

    // Hole filling (if player pushes box into hole)
    if (targetCell === CellType.Hole) {
      // Hole can only be filled by box, not player
      // If player steps on hole, they fall through (reset level)
      gameState.value.grid[newY][newX] = CellType.Empty;
      ElMessage.warning('你掉入了洞穴！');
      initLevel(currentLevelIndex.value);
      return;
    }

    // Trap handling
    if (targetCell === CellType.Trap) {
      // Trap doesn't affect player, only boxes
      moved = true;
    }

    // 5. Normal walkable cells
    const normalWalkable = [CellType.Floor, CellType.Target, CellType.Empty].includes(targetCell);
    if (normalWalkable || moved) {
      // Move player
      gameState.value.playerPos = { x: finalX, y: finalY };
      gameState.value.moves++;
      history.value.push(stateSnapshot);
    }

    // 6. Box interaction
    else if (targetCell === CellType.Box || targetCell === CellType.BoxOnTarget || targetCell === CellType.BoxOnIce) {
      const boxNextX = newX + dx;
      const boxNextY = newY + dy;

      // Bounds for box
      if (boxNextY < 0 || boxNextY >= gameState.value.grid.length || boxNextX < 0 || boxNextX >= gameState.value.grid[0].length) return;

      const boxNextCell = gameState.value.grid[boxNextY][boxNextX];

      // Can we push the box?
      const canPushBox = [CellType.Floor, CellType.Target, CellType.Empty, CellType.Ice, CellType.Hole, CellType.Trap, 
                          CellType.MagnetNorth, CellType.MagnetSouth, CellType.MagnetEast, CellType.MagnetWest].includes(boxNextCell);

      // Switch wall check for box
      if (boxNextCell === CellType.SwitchWall && !switchActivated.value) return;

      if (canPushBox) {
        const staticMap = levels[currentLevelIndex.value].map;
        const isTargetAtCurrentBox = staticMap[newY][newX] === CellType.Target;
        const isTargetAtNextBox = staticMap[boxNextY][boxNextX] === CellType.Target;

        // Handle special box destinations
        let finalBoxX = boxNextX;
        let finalBoxY = boxNextY;
        let boxDestroyed = false;

        // Hole handling - box falls in
        if (boxNextCell === CellType.Hole) {
          gameState.value.grid[boxNextY][boxNextX] = CellType.BoxOnHole;
          boxDestroyed = true;
        }

        // Trap handling - box disappears
        if (boxNextCell === CellType.Trap) {
          gameState.value.grid[boxNextY][boxNextX] = CellType.Floor;
          boxDestroyed = true;
        }

        // Ice handling - box slides
        if (boxNextCell === CellType.Ice) {
          const slideResult = handleIceSlide(boxNextX, boxNextY, dx, dy, true);
          if (slideResult) {
            finalBoxX = slideResult.x;
            finalBoxY = slideResult.y;
          }
        }

        if (!boxDestroyed) {
          // Update box position
          gameState.value.grid[finalBoxY][finalBoxX] = isTargetAtNextBox ? CellType.BoxOnTarget : 
            boxNextCell === CellType.Ice ? CellType.BoxOnIce : CellType.Box;
        }

        // Restore original cell
        gameState.value.grid[newY][newX] = isTargetAtCurrentBox ? CellType.Target : 
          targetCell === CellType.BoxOnIce ? CellType.Ice : CellType.Floor;

        // Move Player
        gameState.value.playerPos = { x: newX, y: newY };
        gameState.value.moves++;
        history.value.push(stateSnapshot);

        checkWin();
      }
    }
  };

  const undo = () => {
    if (history.value.length === 0) return;
    const previousState = JSON.parse(history.value.pop()!);
    gameState.value.grid = previousState.grid;
    gameState.value.playerPos = previousState.playerPos;
    gameState.value.moves = previousState.moves;
    gameState.value.isComplete = false;
    collectedKeys.value = previousState.collectedKeys || 0;
    switchActivated.value = previousState.switchActivated || false;
  };

  const reset = () => {
    initLevel(currentLevelIndex.value);
    ElMessage.info('游戏已重置');
  };

  return {
    gameState,
    initLevel,
    move,
    undo,
    reset,
    levels,
    collectedKeys,
    switchActivated
  };
}
