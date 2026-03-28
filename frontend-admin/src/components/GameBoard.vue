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
            <!-- 新障碍类型的图标 -->
            <el-icon v-else-if="getCellAt(col - 1, row - 1) === 25" class="box-ice-icon"><Box /></el-icon>
            <el-icon v-else-if="getCellAt(col - 1, row - 1) === 26" class="box-hole-icon"><Box /></el-icon>
            <el-icon v-else-if="getCellAt(col - 1, row - 1) === 10" class="portal-icon"><Connection /></el-icon>
            <el-icon v-else-if="getCellAt(col - 1, row - 1) === 11" class="portal-icon"><Connection /></el-icon>
            <el-icon v-else-if="getCellAt(col - 1, row - 1) === 12" class="oneway-icon"><ArrowRight /></el-icon>
            <el-icon v-else-if="getCellAt(col - 1, row - 1) === 13" class="oneway-icon"><ArrowDown /></el-icon>
            <el-icon v-else-if="getCellAt(col - 1, row - 1) === 14" class="oneway-icon"><ArrowLeft /></el-icon>
            <el-icon v-else-if="getCellAt(col - 1, row - 1) === 15" class="oneway-icon"><ArrowUp /></el-icon>
            <el-icon v-else-if="getCellAt(col - 1, row - 1) === 16" class="lock-icon"><Lock /></el-icon>
            <el-icon v-else-if="getCellAt(col - 1, row - 1) === 17" class="key-icon"><Key /></el-icon>
            <el-icon v-else-if="getCellAt(col - 1, row - 1) === 18" class="switch-icon"><SwitchButton /></el-icon>
          </template>
        </div>
      </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import { CellType, type Position } from '@/types';
import { User, Box, Flag, CircleCheckFilled, IceCream, Clock, ArrowRight, ArrowDown, ArrowLeft, ArrowUp, Lock, Key, SwitchButton, Connection, Place } from '@element-plus/icons-vue';

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
  else if (cell === CellType.Ice) classes.push('is-ice');
  else if (cell === CellType.Trap) classes.push('is-trap');
  else if (cell === CellType.PortalA) classes.push('is-portal-a');
  else if (cell === CellType.PortalB) classes.push('is-portal-b');
  else if (cell === CellType.OneWayDoorRight) classes.push('is-oneway-right');
  else if (cell === CellType.OneWayDoorDown) classes.push('is-oneway-down');
  else if (cell === CellType.OneWayDoorLeft) classes.push('is-oneway-left');
  else if (cell === CellType.OneWayDoorUp) classes.push('is-oneway-up');
  else if (cell === CellType.Lock) classes.push('is-lock');
  else if (cell === CellType.Key) classes.push('is-key');
  else if (cell === CellType.Switch) classes.push('is-switch');
  else if (cell === CellType.SwitchWall) classes.push('is-switch-wall');
  else if (cell === CellType.Hole) classes.push('is-hole');
  else if (cell === CellType.MagnetNorth) classes.push('is-magnet-north');
  else if (cell === CellType.MagnetSouth) classes.push('is-magnet-south');
  else if (cell === CellType.MagnetEast) classes.push('is-magnet-east');
  else if (cell === CellType.MagnetWest) classes.push('is-magnet-west');
  else if (cell === CellType.BoxOnIce) classes.push('is-box-on-ice');
  else if (cell === CellType.BoxOnHole) classes.push('is-box-on-hole');
  else if (cell === CellType.PlayerOnIce) classes.push('is-player-on-ice');
  else if (cell === CellType.PlayerOnTrap) classes.push('is-player-on-trap');
  else if (cell === CellType.PlayerOnPortal) classes.push('is-player-on-portal');
  else if (cell === CellType.PlayerOnLock) classes.push('is-player-on-lock');
  else if (cell === CellType.PlayerOnKey) classes.push('is-player-on-key');
  else if (cell === CellType.PlayerOnSwitch) classes.push('is-player-on-switch');
  else if (cell === CellType.PlayerOnMagnet) classes.push('is-player-on-magnet');
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

// 新障碍类型的样式
.grid-cell.is-ice {
  background: #E3F2FD; // 浅蓝色，代表冰块
  background-image: 
    radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.8) 3px, transparent 3px),
    radial-gradient(circle at 60% 70%, rgba(255, 255, 255, 0.6) 2px, transparent 2px),
    radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.7) 2px, transparent 2px);
  border-radius: 4px;
  box-shadow: 
    inset 0 2px 4px rgba(255, 255, 255, 0.5),
    inset 0 -2px 4px rgba(100, 181, 246, 0.3);
}

.grid-cell.is-trap {
  background: #FFEBEE; // 浅红色，代表陷阱
  background-image: 
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 4px,
      rgba(244, 67, 54, 0.2) 4px,
      rgba(244, 67, 54, 0.2) 8px
    );
  border-radius: 2px;
  box-shadow: 
    inset 0 0 0 2px rgba(244, 67, 54, 0.3);
}

.grid-cell.is-portal-a {
  background: #E8F5E9; // 浅绿色，代表传送门A
  background-image: 
    radial-gradient(circle at center, rgba(76, 175, 80, 0.5) 0%, transparent 70%);
  border-radius: 50%;
  box-shadow: 
    0 0 10px rgba(76, 175, 80, 0.5),
    inset 0 0 10px rgba(76, 175, 80, 0.3);
}

.grid-cell.is-portal-b {
  background: #F3E5F5; // 浅紫色，代表传送门B
  background-image: 
    radial-gradient(circle at center, rgba(156, 39, 176, 0.5) 0%, transparent 70%);
  border-radius: 50%;
  box-shadow: 
    0 0 10px rgba(156, 39, 176, 0.5),
    inset 0 0 10px rgba(156, 39, 176, 0.3);
}

.grid-cell.is-oneway-right,
.grid-cell.is-oneway-down,
.grid-cell.is-oneway-left,
.grid-cell.is-oneway-up {
  background: #FFF3E0; // 浅橙色，代表单向门
  background-image: 
    radial-gradient(circle at center, rgba(255, 152, 0, 0.3) 0%, transparent 70%);
  border-radius: 4px;
  box-shadow: 
    inset 0 2px 4px rgba(255, 152, 0, 0.2),
    inset 0 -2px 4px rgba(255, 152, 0, 0.1);
}

.grid-cell.is-lock {
  background: #FFEB3B; // 黄色，代表锁
  background-image: 
    radial-gradient(circle at center, rgba(255, 235, 59, 0.5) 0%, transparent 70%);
  border-radius: 4px;
  box-shadow: 
    inset 0 2px 4px rgba(255, 235, 59, 0.3),
    0 2px 4px rgba(0, 0, 0, 0.1);
}

.grid-cell.is-key {
  background: #FFECB3; // 浅黄色，代表钥匙
  background-image: 
    radial-gradient(circle at center, rgba(255, 193, 7, 0.4) 0%, transparent 70%);
  border-radius: 4px;
  box-shadow: 
    inset 0 2px 4px rgba(255, 193, 7, 0.2),
    0 2px 4px rgba(0, 0, 0, 0.1);
}

.grid-cell.is-switch {
  background: #B3E5FC; // 浅蓝色，代表开关
  background-image: 
    radial-gradient(circle at center, rgba(33, 150, 243, 0.4) 0%, transparent 70%);
  border-radius: 4px;
  box-shadow: 
    inset 0 2px 4px rgba(33, 150, 243, 0.2),
    0 2px 4px rgba(0, 0, 0, 0.1);
}

.grid-cell.is-switch-wall {
  background: #795548; // 棕色，代表开关墙
  background-image: 
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 4px,
      rgba(121, 85, 72, 0.3) 4px,
      rgba(121, 85, 72, 0.3) 8px
    );
  border-radius: 2px;
  box-shadow: 
    inset 0 1px 2px rgba(0, 0, 0, 0.3),
    0 2px 4px rgba(0, 0, 0, 0.1);
}

.grid-cell.is-hole {
  background: #424242; // 深灰色，代表洞
  background-image: 
    radial-gradient(circle at center, rgba(0, 0, 0, 0.5) 0%, rgba(66, 66, 66, 0.8) 100%);
  border-radius: 50%;
  box-shadow: 
    inset 0 2px 8px rgba(0, 0, 0, 0.5),
    0 2px 4px rgba(0, 0, 0, 0.2);
}

.grid-cell.is-magnet-north,
.grid-cell.is-magnet-south,
.grid-cell.is-magnet-east,
.grid-cell.is-magnet-west {
  background: #FCE4EC; // 浅粉色，代表磁铁
  background-image: 
    radial-gradient(circle at center, rgba(233, 30, 99, 0.4) 0%, transparent 70%);
  border-radius: 4px;
  box-shadow: 
    inset 0 2px 4px rgba(233, 30, 99, 0.2),
    0 2px 4px rgba(0, 0, 0, 0.1);
}

.grid-cell.is-box-on-ice {
  background: #E3F2FD; // 冰块背景
  background-image: 
    radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.8) 3px, transparent 3px),
    radial-gradient(circle at 60% 70%, rgba(255, 255, 255, 0.6) 2px, transparent 2px);
  border-radius: 4px;
}

.grid-cell.is-box-on-hole {
  background: #424242; // 洞背景
  background-image: 
    radial-gradient(circle at center, rgba(0, 0, 0, 0.5) 0%, rgba(66, 66, 66, 0.8) 100%);
  border-radius: 50%;
}

// 新障碍类型的图标样式
.portal-icon {
  color: #66BB6A; // 绿色，代表传送门
  font-size: 80%;
  filter: drop-shadow(0 2px 4px rgba(102, 187, 106, 0.4));
}

.oneway-icon {
  color: #FF9800; // 橙色，代表单向门
  font-size: 75%;
  filter: drop-shadow(0 2px 4px rgba(255, 152, 0, 0.4));
}

.lock-icon {
  color: #FFC107; // 黄色，代表锁
  font-size: 80%;
  filter: drop-shadow(0 2px 4px rgba(255, 193, 7, 0.4));
}

.key-icon {
  color: #FFD54F; // 浅黄色，代表钥匙
  font-size: 75%;
  filter: drop-shadow(0 2px 4px rgba(255, 213, 79, 0.4));
}

.switch-icon {
  color: #2196F3; // 蓝色，代表开关
  font-size: 80%;
  filter: drop-shadow(0 2px 4px rgba(33, 150, 243, 0.4));
}

.box-ice-icon,
.box-hole-icon {
  color: #D68910; // 与箱子相同的颜色
  font-size: 95%;
  filter: drop-shadow(0 3px 6px rgba(214, 137, 16, 0.5));
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
