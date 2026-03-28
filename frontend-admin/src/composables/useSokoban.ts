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

  const initLevel = (index: number) => {
    const level = levels[index];
    if (!level) return;

    currentLevelIndex.value = index;
    gameState.value.currentLevel = level.id;
    gameState.value.moves = 0;
    gameState.value.isComplete = false;
    history.value = [];

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

  const move = (dx: number, dy: number) => {
    if (gameState.value.isComplete) return;

    const { x, y } = gameState.value.playerPos;
    const newX = x + dx;
    const newY = y + dy;

    // Bounds check
    if (newY < 0 || newY >= gameState.value.grid.length || newX < 0 || newX >= gameState.value.grid[0].length) return;

    const targetCell = gameState.value.grid[newY][newX];

    // 1. Wall check
    if (targetCell === CellType.Wall) return;

    // 2. Empty/Floor/Target check (Walkable)
    const isWalkable = [CellType.Floor, CellType.Target, CellType.Empty].includes(targetCell);

    // Save state for undo
    const stateSnapshot = JSON.stringify({
      grid: gameState.value.grid,
      playerPos: gameState.value.playerPos,
      moves: gameState.value.moves
    });

    if (isWalkable) {
        // Just move
        gameState.value.playerPos = { x: newX, y: newY };
        gameState.value.moves++;
        history.value.push(stateSnapshot);
    }
    // 3. Box interaction
    else if (targetCell === CellType.Box || targetCell === CellType.BoxOnTarget) {
        const boxNextX = newX + dx;
        const boxNextY = newY + dy;

        // Bounds for box
        if (boxNextY < 0 || boxNextY >= gameState.value.grid.length || boxNextX < 0 || boxNextX >= gameState.value.grid[0].length) return;

        const boxNextCell = gameState.value.grid[boxNextY][boxNextX];

        // Can we push the box? (Behind box must be Floor or Target)
        // NOTE: We need to preserve the underlying cell type (Floor vs Target) when moving a box out.
        // This simple grid approach might lose info if we overwrite.
        // Better approach: Grid represents OBJECTS, but we need to know STATIC MAP for Targets.

        if ([CellType.Floor, CellType.Target, CellType.Empty].includes(boxNextCell)) {
            // Move Box
            // Logic:
            // - Restore cell at (newX, newY) to what it should be without box (Floor or Target)
            // - Set cell at (boxNextX, boxNextY) to Box (or BoxOnTarget)

            const staticMap = levels[currentLevelIndex.value].map;
            const isTargetAtCurrentBox = staticMap[newY][newX] === CellType.Target;
            const isTargetAtNextBox = staticMap[boxNextY][boxNextX] === CellType.Target;

            // Update Grid
            // Old Box pos becomes Floor or Target
            gameState.value.grid[newY][newX] = isTargetAtCurrentBox ? CellType.Target : CellType.Floor;

            // New Box pos becomes Box or BoxOnTarget
            gameState.value.grid[boxNextY][boxNextX] = isTargetAtNextBox ? CellType.BoxOnTarget : CellType.Box;

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
    levels
  };
}
