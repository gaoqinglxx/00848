<template>
  <div class="control-panel">
    <!-- 状态栏（深橄榄绿色背景，圆角） -->
    <div
      class="stats-bar"
      :style="props.canvasWidth ? { width: `${props.canvasWidth}px` } : {}"
    >
      <span class="stats-text">第{{ currentLevelIndex + 1 }}/{{ levels.length }}关 移动次数:{{ moves }}{{ props.keys !== undefined && props.keys > 0 ? ` 钥匙:${props.keys}` : '' }}</span>
    </div>

    <!-- 游戏说明弹窗 -->
    <el-dialog
      v-model="showInstructions"
      title="游戏说明"
      width="520px"
      :close-on-click-modal="true"
      :close-on-press-escape="true"
      class="instructions-dialog"
    >
      <template #header>
        <div class="dialog-header">
          <el-icon :size="24" class="header-icon"><InfoFilled /></el-icon>
          <span class="dialog-title">游戏说明</span>
        </div>
      </template>
      <div class="instructions-content">
        <div class="instruction-item">
          <p>用键盘上的上↑、下↓、左←、右→键移动人物，把箱子全部推到小球的位置即可过关。</p>
        </div>
        <div class="instruction-item">
          <p>箱子只可向前推，不能往后拉，并且小人一次只能推动一个箱子。</p>
        </div>
        <div class="instruction-item">
          <p>这里特地采用了护眼的颜色，久玩不累眼，喜欢的朋友可以收藏网址，欢迎大家常来玩！</p>
        </div>
      </div>
    </el-dialog>

    <!-- 按钮区域（无背景，透明） -->
    <div class="actions">
      <div class="action-buttons">
        <el-button
          class="action-btn"
          :disabled="currentLevelIndex === 0"
          @click="handlePrevLevel"
        >
          上一关
        </el-button>
        <el-button
          class="action-btn"
          :disabled="currentLevelIndex === levels.length - 1"
          @click="handleNextLevel"
        >
          下一关
        </el-button>
        <el-button
          class="action-btn"
          @click="$emit('reset')"
        >
          重玩本关
        </el-button>
        <el-button
          class="action-btn"
          @click="showInstructions = true"
        >
          游戏说明
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { InfoFilled } from '@element-plus/icons-vue';
import type { LevelData } from '@/types';

const props = defineProps<{
  moves: number;
  levels: LevelData[];
  currentLevelIndex: number;
  canvasWidth?: number; // 画布宽度（可选）
  keys?: number; // 钥匙数量
}>();

const emit = defineEmits(['reset', 'changeLevel']);

const showInstructions = ref(false);

const handlePrevLevel = () => {
  if (props.currentLevelIndex > 0) {
    emit('changeLevel', props.currentLevelIndex - 1);
  }
};

const handleNextLevel = () => {
  if (props.currentLevelIndex < props.levels.length - 1) {
    emit('changeLevel', props.currentLevelIndex + 1);
  }
};
</script>

<style scoped lang="scss">
@use 'sass:color';

.control-panel {
  width: 100%;
  // 移除背景色和边框，透明显示
  background: transparent;
  border: none;
  border-radius: 0;
  padding: 0;
  box-shadow: none;
  position: relative;
  box-sizing: border-box;
}

// 状态栏（白色背景，深色字体，圆角）
.stats-bar {
  // 宽度通过 props.canvasWidth 动态设置，与画布宽度一致
  margin: 0 auto $spacing-md auto; // 居中，下方间距
  background: #ffffff; // 白色背景
  border: 2px solid rgba(107, 142, 35, 0.3); // 橄榄绿色边框，与页面主题协调
  border-radius: $border-radius;
  padding: $spacing-md $spacing-lg;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(0, 0, 0, 0.05); // 柔和阴影，增强层次
  display: flex;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;

  .stats-text {
    font-size: $font-size-body;
    color: #6B8E23; // 橄榄绿色字体
    font-weight: $font-weight-medium;
    text-shadow: none; // 移除文字阴影
    white-space: nowrap;
  }
}

.actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-md;
  width: 100%;
  // 无背景，透明
  background: transparent;
}

.action-buttons {
  display: flex;
  gap: $spacing-md;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
}

.action-btn {
  min-width: 120px;
  height: 44px;
  // 与 header 背景色一致
  background: $header-bg !important; // #556B2F 深橄榄绿色，与 header 一致
  border: 2px solid rgba(255, 255, 255, 0.2) !important; // 白色半透明边框
  color: #ffffff !important; // 白色字体
  font-weight: $font-weight-medium;
  transition: $transition-fast;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);

  &:hover:not(:disabled) {
    background: color.mix(white, $header-bg, 10%) !important; // 稍浅的绿色
    color: #ffffff !important;
    border-color: rgba(255, 255, 255, 0.3) !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  }

  &:disabled {
    background: rgba(85, 107, 47, 0.5) !important;
    color: rgba(255, 255, 255, 0.5) !important;
    border-color: rgba(255, 255, 255, 0.1) !important;
    opacity: 0.6;
    cursor: not-allowed;
  }
}

// 弹窗样式美化
:deep(.instructions-dialog) {
  padding: 0 !important;

  .el-dialog {
    border-radius: $border-radius-lg;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(107, 142, 35, 0.2);
  }

  .el-dialog__header {
    padding: $spacing-lg $spacing-xl;
    border-bottom: 1px solid rgba(107, 142, 35, 0.1);
    background: linear-gradient(135deg, #F5F7FA 0%, #FFFFFF 100%);
    border-radius: $border-radius-lg $border-radius-lg 0 0;
  }

  .el-dialog__body {
    background: #FFFFFF;
    padding: 24px;
  }

  .el-dialog__headerbtn {
    top: $spacing-lg;
    right: $spacing-xl;
  }
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: $spacing-sm;

  .header-icon {
    color: #6B8E23;
  }

  .dialog-title {
    font-size: $font-size-h3;
    font-weight: $font-weight-bold;
    color: #303133;
  }
}

.instructions-content {
  .instruction-item {
    display: flex;
    align-items: flex-start;
    gap: $spacing-md;
    margin-bottom: $spacing-lg;
    padding: $spacing-md;
    background: linear-gradient(135deg, #F9FAFB 0%, #FFFFFF 100%);
    border-radius: $border-radius-sm;
    border-left: 3px solid #6B8E23;
    transition: $transition-fast;

    &:hover {
      background: linear-gradient(135deg, #F5F7FA 0%, #F9FAFB 100%);
      transform: translateX(4px);
      box-shadow: 0 2px 8px rgba(107, 142, 35, 0.1);
    }

    &:last-child {
      margin-bottom: 0;
    }

    .item-icon {
      color: #6B8E23;
      font-size: 20px;
      margin-top: 2px;
      flex-shrink: 0;
    }

    p {
      margin: 0;
      line-height: $line-height-body;
      color: #303133;
      font-size: $font-size-body;
      text-align: left;
    }
  }
}
</style>
