<template>
  <div class="app-container">
    <GameHeader />

    <div class="layout-wrapper">
      <GameBoard
            :grid="gameState.grid"
            :player-pos="gameState.playerPos"
            :keys="gameState.keys"
            :doors-open="gameState.doorsOpen"
            :pressure-plates-active="gameState.pressurePlatesActive"
            :current-level-index="gameState.currentLevel - 1"
            @canvas-width-change="handleCanvasWidthChange"
          />

      <footer class="controls-section">
        <GameControls
          :moves="gameState.moves"
          :levels="levels"
          :current-level-index="gameState.currentLevel - 1"
          :canvas-width="canvasWidth"
          :keys="gameState.keys"
          @reset="reset"
          @change-level="handleLevelChange"
        />
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import GameHeader from '@/components/GameHeader.vue';
import GameBoard from '@/components/GameBoard.vue';
import GameControls from '@/components/GameControls.vue';
import { useSokoban } from '@/composables/useSokoban';

const { gameState, initLevel, move, undo, reset, levels } = useSokoban();

// 画布宽度
const canvasWidth = ref<number | undefined>(undefined);

const handleLevelChange = (index: number) => {
  initLevel(index);
};

const handleCanvasWidthChange = (width: number) => {
  canvasWidth.value = width;
};

// Keyboard Support
// move(dx, dy): 根据实际测试，参数顺序可能是反的
// 如果按上下键实际是左右走，说明需要交换参数
const handleKeydown = (e: KeyboardEvent) => {
  switch(e.key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      move(-1, 0); // 向上：交换参数，实际移动 y 方向
      break;
    case 'ArrowDown':
    case 's':
    case 'S':
      move(1, 0); // 向下：交换参数，实际移动 y 方向
      break;
    case 'ArrowLeft':
    case 'a':
    case 'A':
      move(0, -1); // 向左：交换参数，实际移动 x 方向
      break;
    case 'ArrowRight':
    case 'd':
    case 'D':
      move(0, 1); // 向右：交换参数，实际移动 x 方向
      break;
    case 'u':
    case 'U':
    case 'z': // Ctrl+Z usually, but simplified here
      undo();
      break;
    case 'r':
    case 'R':
      reset();
      break;
  }
};

onMounted(() => {
  initLevel(0);
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped lang="scss">

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column; // 改为纵向布局
  background: $bg-color; // 淡绿色背景
  background-image:
    radial-gradient(circle at 20% 50%, rgba(139, 195, 74, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(107, 142, 35, 0.15) 0%, transparent 50%);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(0, 0, 0, 0.02) 35px, rgba(0, 0, 0, 0.02) 70px);
    pointer-events: none;
  }
}

.layout-wrapper {
  width: 100%;
  max-width: 900px;
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
  position: relative;
  z-index: 1;
  // 确保模块对齐
  box-sizing: border-box;
  margin: 0 auto; // 居中显示
  padding: $spacing-lg $spacing-md; // 添加内边距
  flex: 1; // 占据剩余空间
}

.board-section {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  // 添加浅色背景，突出画布区域
  background: rgba(255, 255, 255, 0.6); // 半透明白色背景，突出画布
  border-radius: $border-radius-lg;
  padding: $spacing-md;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1); // 添加阴影，增强层次
  border: 1px solid rgba(200, 230, 201, 0.3); // 淡绿色边框
  position: relative;
  overflow: hidden; // 防止超出
  // 确保与下方控制面板对齐
  box-sizing: border-box;
}

.controls-section {
  width: 100%;
  border-radius: $border-radius-lg;
  padding: 0 $spacing-md $spacing-lg;
  box-sizing: border-box;
}
</style>
