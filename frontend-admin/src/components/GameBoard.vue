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
            <el-icon v-else-if="getStaticCellAt(col - 1, row - 1) === 3" class="target-icon"><Flag /></el-icon>
            <el-icon v-else-if="getStaticCellAt(col - 1, row - 1) === 8" class="ice-icon"><Star /></el-icon>
            <el-icon v-else-if="getStaticCellAt(col - 1, row - 1) === 9" class="pressure-plate-icon">
              <component :is="isPressurePlateActive(col - 1, row - 1) ? CircleCheckFilled : Close" />
            </el-icon>
            <el-icon v-else-if="getStaticCellAt(col - 1, row - 1) === 10" class="door-icon">
              <component :is="isDoorOpen(col - 1, row - 1) ? CircleCheckFilled : Close" />
            </el-icon>
            <el-icon v-else-if="getStaticCellAt(col - 1, row - 1) === 11 && getCellAt(col - 1, row - 1) !== CellType.Floor" class="key-icon"><Key /></el-icon>
            <el-icon v-else-if="getStaticCellAt(col - 1, row - 1) === 12 && getCellAt(col - 1, row - 1) !== CellType.Floor" class="lock-icon"><Lock /></el-icon>
            <el-icon v-else-if="getStaticCellAt(col - 1, row - 1) === 13" class="oneway-icon"><ArrowRight /></el-icon>
            <el-icon v-else-if="getStaticCellAt(col - 1, row - 1) === 14" class="oneway-icon"><ArrowLeft /></el-icon>
            <el-icon v-else-if="getStaticCellAt(col - 1, row - 1) === 15" class="oneway-icon"><ArrowUp /></el-icon>
            <el-icon v-else-if="getStaticCellAt(col - 1, row - 1) === 16" class="oneway-icon"><ArrowDown /></el-icon>
            <el-icon v-else-if="getStaticCellAt(col - 1, row - 1) === 17" class="portal-icon portal-a"><Connection /></el-icon>
            <el-icon v-else-if="getStaticCellAt(col - 1, row - 1) === 18" class="portal-icon portal-b"><Connection /></el-icon>
          </template>
        </div>
      </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import { CellType, type Position } from '@/types';
import { levels } from '@/data/levels';
import { User, Box, Flag, CircleCheckFilled, Key, Lock, ArrowRight, ArrowLeft, ArrowUp, ArrowDown, Connection, Close, Star } from '@element-plus/icons-vue';

const props = defineProps<{
  grid: CellType[][];
  playerPos: Position;
  keys: number;
  doorsOpen: Set<string>;
  pressurePlatesActive: Set<string>;
  currentLevelIndex: number;
}>();

const emit = defineEmits<{
  canvasWidthChange: [width: number];
}>();

// 获取当前关卡的静态地图
const staticMap = computed(() => levels[props.currentLevelIndex]?.map || []);

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

// 获取静态地图中指定位置的单元格
const getStaticCellAt = (canvasX: number, canvasY: number) => {
  if (!isInMapBounds(canvasX, canvasY)) {
    return CellType.Empty;
  }
  const mapX = canvasX - startCol.value;
  const mapY = canvasY - startRow.value;
  return staticMap.value[mapY]?.[mapX] || CellType.Empty;
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

// 检查门是否打开
const isDoorOpen = (canvasX: number, canvasY: number) => {
  if (!isInMapBounds(canvasX, canvasY)) {
    return false;
  }
  const mapX = canvasX - startCol.value;
  const mapY = canvasY - startRow.value;
  return props.doorsOpen.has(`${mapX},${mapY}`);
};

// 检查压力板是否激活
const isPressurePlateActive = (canvasX: number, canvasY: number) => {
  if (!isInMapBounds(canvasX, canvasY)) {
    return false;
  }
  const mapX = canvasX - startCol.value;
  const mapY = canvasY - startRow.value;
  return props.pressurePlatesActive.has(`${mapX},${mapY}`);
};

// 获取画布位置的单元格类型（用于样式）
const getCellClassForPosition = (canvasX: number, canvasY: number) => {
  const classes = [];

  if (!isInMapBounds(canvasX, canvasY)) {
    classes.push('is-empty');
    return classes.join(' ');
  }

  const cell = getCellAt(canvasX, canvasY);
  const staticCell = getStaticCellAt(canvasX, canvasY);

  if (staticCell === CellType.Wall) classes.push('is-wall');
  else if (staticCell === CellType.Ice) classes.push('is-ice');
  else if (staticCell === CellType.PressurePlate) classes.push('is-pressure-plate');
  else if (staticCell === CellType.Door) classes.push(isDoorOpen(canvasX, canvasY) ? 'is-door-open' : 'is-door-closed');
  else if (staticCell === CellType.OneWayRight || staticCell === CellType.OneWayLeft || 
           staticCell === CellType.OneWayUp || staticCell === CellType.OneWayDown) classes.push('is-oneway');
  else if (staticCell === CellType.PortalA || staticCell === CellType.PortalB) classes.push('is-portal');
  else if (staticCell === CellType.Target) classes.push('is-target');
  else if (cell === CellType.Floor || cell === CellType.Empty) classes.push('is-floor');

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

  &.is-ice {
    // 冰面使用浅蓝色
    background: #E3F2FD;
    border-radius: 2px;
    box-shadow:
      inset 0 0 0 1px rgba(33, 150, 243, 0.3);
  }

  &.is-pressure-plate {
    // 压力板使用灰色
    background: #F5F5F5;
    border-radius: 2px;
    box-shadow:
      inset 0 0 0 1px rgba(158, 158, 158, 0.5);
  }

  &.is-door-closed {
    // 关闭的门使用深棕色
    background: #8D6E63;
    border-radius: 2px;
    box-shadow:
      inset 0 0 0 1px rgba(62, 39, 35, 0.5);
  }

  &.is-door-open {
    // 打开的门使用浅绿色
    background: #C8E6C9;
    border-radius: 2px;
    box-shadow:
      inset 0 0 0 1px rgba(76, 175, 80, 0.3);
  }

  &.is-oneway {
    // 单向门使用浅黄色
    background: #FFF9C4;
    border-radius: 2px;
    box-shadow:
      inset 0 0 0 1px rgba(255, 193, 7, 0.4);
  }

  &.is-portal {
    // 传送门使用紫色
    background: #F3E5F5;
    border-radius: 2px;
    box-shadow:
      inset 0 0 0 1px rgba(156, 39, 176, 0.3);
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

.ice-icon {
  font-size: 60%;
  opacity: 0.5;
}

.pressure-plate-icon {
  color: #9E9E9E;
  font-size: 70%;
  filter: drop-shadow(0 2px 4px rgba(158, 158, 158, 0.4));
}

.door-icon {
  color: #8D6E63;
  font-size: 80%;
  filter: drop-shadow(0 2px 4px rgba(141, 110, 99, 0.4));
}

.key-icon {
  color: #FFD700;
  font-size: 75%;
  filter: drop-shadow(0 2px 4px rgba(255, 215, 0, 0.5));
  animation: glow 1.5s ease-in-out infinite;
}

.lock-icon {
  color: #795548;
  font-size: 75%;
  filter: drop-shadow(0 2px 4px rgba(121, 85, 72, 0.4));
}

.oneway-icon {
  color: #FF9800;
  font-size: 70%;
  filter: drop-shadow(0 2px 4px rgba(255, 152, 0, 0.4));
}

.portal-icon {
  font-size: 80%;
  filter: drop-shadow(0 2px 4px rgba(156, 39, 176, 0.4));
  animation: portalPulse 2s ease-in-out infinite;

  &.portal-a {
    color: #9C27B0;
  }

  &.portal-b {
    color: #E91E63;
  }
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

@keyframes portalPulse {
  0%, 100% { 
    opacity: 1;
    transform: scale(1);
  }
  50% { 
    opacity: 0.7;
    transform: scale(1.1);
  }
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
