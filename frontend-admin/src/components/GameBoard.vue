<template>
  <div
      class="game-grid"
      :style="{
        gridTemplateColumns: `repeat(${CANVAS_SIZE}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${CANVAS_SIZE}, ${cellSize}px)`,
      }"
    >
      <!-- 渲染固定尺寸的画布 -->
      <div
        v-for="row in CANVAS_SIZE"
        :key="`row-${row - 1}`"
        class="grid-row"
      >
        <div
          v-for="col in CANVAS_SIZE"
          :key="`col-${col - 1}`"
          class="grid-cell"
          :class="getCellClassForPosition(col - 1, row - 1)"
        >
          <!-- 只在有效地图区域内显示内容 -->
          <template v-if="isInMapBounds(col - 1, row - 1)">
            <el-icon v-if="isPlayerAt(col - 1, row - 1)" class="player-icon"><User /></el-icon>
            <el-icon v-else-if="getCellAt(col - 1, row - 1) === 4" class="box-icon"><Box /></el-icon>
            <el-icon v-else-if="getCellAt(col - 1, row - 1) === 6" class="box-target-icon"><CircleCheckFilled /></el-icon>
            <el-icon v-else-if="getCellAt(col - 1, row - 1) === 3" class="target-icon"><Flag /></el-icon>
          </template>
        </div>
      </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import { CellType, type Position } from '@/types';
import { User, Box, Flag, CircleCheckFilled } from '@element-plus/icons-vue';

const props = defineProps<{
  grid: CellType[][];
  playerPos: Position;
}>();

const emit = defineEmits<{
  canvasWidthChange: [width: number];
}>();

// 固定画布尺寸（正方形）- 减少尺寸，避免底部多余格子
const CANVAS_SIZE = 12;

const height = computed(() => props.grid.length);
const width = computed(() => props.grid[0]?.length || 0);

// 计算地图在画布中的起始位置（居中显示）
const startCol = computed(() => Math.floor((CANVAS_SIZE - width.value) / 2));
const startRow = computed(() => Math.floor((CANVAS_SIZE - height.value) / 2));

// 单元格大小（响应式）
const cellSize = ref(40);

// 计算单元格大小
const calculateCellSize = () => {
  // 根据容器高度计算，确保画布能完整显示
  const containerHeight = window.innerHeight * 0.5; // 游戏区域高度
  const calculatedSize = Math.floor(containerHeight / CANVAS_SIZE);
  cellSize.value = Math.max(45, Math.min(calculatedSize, 65)); // 限制在 45-65px 之间，增大尺寸
};

// 计算画布宽度
const canvasWidth = computed(() => {
  // 画布宽度 = CANVAS_SIZE * cellSize + gap * (CANVAS_SIZE - 1) + padding * 2 + border * 2
  // gap = 2px, padding = 3px, border = 3px * 2 = 6px
  return CANVAS_SIZE * cellSize.value + 2 * (CANVAS_SIZE - 1) + 3 * 2 + 6;
});

// 监听画布宽度变化并发送事件
watch(canvasWidth, (width) => {
  emit('canvasWidthChange', width);
}, { immediate: true });

onMounted(() => {
  calculateCellSize();
  window.addEventListener('resize', calculateCellSize);
});

onUnmounted(() => {
  window.removeEventListener('resize', calculateCellSize);
});

// 检查坐标是否在地图范围内
const isInMapBounds = (canvasX: number, canvasY: number) => {
  const mapX = canvasX - startCol.value;
  const mapY = canvasY - startRow.value;
  return mapX >= 0 && mapX < width.value && mapY >= 0 && mapY < height.value;
};

// 获取地图中指定位置的单元格
const getCellAt = (canvasX: number, canvasY: number) => {
  if (!isInMapBounds(canvasX, canvasY)) {
    return CellType.Empty;
  }
  const mapX = canvasX - startCol.value;
  const mapY = canvasY - startRow.value;
  return props.grid[mapY][mapX];
};

// 检查玩家是否在指定位置
const isPlayerAt = (canvasX: number, canvasY: number) => {
  if (!isInMapBounds(canvasX, canvasY)) {
    return false;
  }
  const mapX = canvasX - startCol.value;
  const mapY = canvasY - startRow.value;
  return props.playerPos.x === mapX && props.playerPos.y === mapY;
};

// 获取画布位置的单元格类型（用于样式）
const getCellClassForPosition = (canvasX: number, canvasY: number) => {
  const classes = [];

  if (!isInMapBounds(canvasX, canvasY)) {
    classes.push('is-empty');
    return classes.join(' ');
  }

  const cell = getCellAt(canvasX, canvasY);

  if (cell === CellType.Wall) classes.push('is-wall');
  else if (cell === CellType.Floor) classes.push('is-floor');
  else if (cell === CellType.Target) classes.push('is-target');
  else classes.push('is-empty');

  // 检查玩家位置
  if (isPlayerAt(canvasX, canvasY)) {
    classes.push('is-player');
  }

  return classes.join(' ');
};
</script>

<style scoped lang="scss">

.game-grid {
  display: grid;
  gap: 2px; // 增大gap，让格子更明显
  // 浅绿色网格背景，突出画布区域
  background: #C8E6C9; // 浅绿色，突出画布
  border: 3px solid rgba(107, 142, 35, 0.6); // 增强边框，突出画布
  border-radius: $border-radius-sm;
  box-shadow:
    0 6px 20px rgba(107, 142, 35, 0.3), // 增强阴影，突出画布
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  box-sizing: border-box;
  padding: 3px;
  margin: 0 auto; // 居中显示
  position: relative;
}

.grid-cell {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(20px, 3.5vw, 32px); // 增大字体
  transition: $transition-fast;
  position: relative;
  box-sizing: border-box;
  // 每个格子四个角有深绿色圆点（参考图片）
  background-image:
    radial-gradient(circle at 10% 10%, rgba(107, 142, 35, 0.5) 2.5px, transparent 2.5px),
    radial-gradient(circle at 90% 10%, rgba(107, 142, 35, 0.5) 2.5px, transparent 2.5px),
    radial-gradient(circle at 10% 90%, rgba(107, 142, 35, 0.5) 2.5px, transparent 2.5px),
    radial-gradient(circle at 90% 90%, rgba(107, 142, 35, 0.5) 2.5px, transparent 2.5px);

  &.is-empty {
    // 空白区域使用背景色，与整体协调
    background: #C8E6C9;
  }

  &.is-wall {
    // 墙壁使用深橄榄绿色，与页面主题协调
    background: #6B8E23; // 使用与页面背景相同的橄榄绿色
    background-image:
      repeating-linear-gradient(
        45deg,
        transparent,
        transparent 4px,
        rgba(0, 0, 0, 0.08) 4px,
        rgba(0, 0, 0, 0.08) 8px
      );
    border-radius: 2px;
    box-shadow:
      inset 0 1px 2px rgba(0, 0, 0, 0.15);
  }

  &.is-floor {
    // 可走区域使用米白色，与绿色背景形成明显对比（参考图片）
    background: #FFFDE7;
    border-radius: 2px;
    box-shadow:
      inset 0 0 0 1px rgba(255, 235, 59, 0.2);
  }

  &.is-target {
    // 目标点使用柔和的黄绿色
    background: #F1F8E9;
    border-radius: 2px;
    box-shadow:
      inset 0 0 0 1px rgba(139, 195, 74, 0.4);
  }

  &.is-player {
    z-index: 10;

    &::before {
      content: '';
      position: absolute;
      inset: -2px;
      border-radius: 50%;
      background: rgba($primary-color, 0.1);
      animation: pulse 2s infinite;
    }
  }
}

// Icon Styles (统一图标风格 - 更大更明显)
.player-icon {
  color: #E53935; // 鲜艳的红色，更明显
  font-size: 95%; // 增大图标尺寸
  animation: bounce 0.5s;
  filter: drop-shadow(0 3px 6px rgba(229, 57, 53, 0.5));
  z-index: 10;
}

.box-icon {
  color: #D68910; // 柔和的橙色
  font-size: 95%; // 增大图标尺寸
  filter: drop-shadow(0 3px 6px rgba(214, 137, 16, 0.5));
  transition: $transition-fast;

  &:hover {
    transform: scale(1.05);
  }
}

.box-target-icon {
  color: #FFC107; // 金色，更明显
  font-size: 100%; // 增大图标尺寸
  filter: drop-shadow(0 3px 6px rgba(255, 193, 7, 0.6));
  animation: glow 1.5s ease-in-out infinite;
}

.target-icon {
  color: #FF6B6B; // 鲜艳的粉红色，更明显
  opacity: 0.9;
  font-size: 75%; // 增大图标尺寸
  filter: drop-shadow(0 2px 4px rgba(255, 107, 107, 0.4));
}

// Animations
@keyframes bounce {
  0% { transform: scale(0.8); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

@keyframes pulse {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.05); }
}

@keyframes glow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .grid-cell {
    width: 30px;
    height: 30px;
    font-size: 16px;
  }

  .player-icon,
  .box-icon {
    font-size: 20px;
  }

  .box-target-icon {
    font-size: 22px;
  }
}
</style>
