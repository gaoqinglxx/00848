<template>
  <header class="game-header">
    <div class="logo">
      <el-icon :size="32" class="logo-icon"><Box /></el-icon>
      <h1>Web Sokoban</h1>
    </div>
    <div class="help-text">
      <el-tag type="info" effect="plain">WASD 或 方向键移动</el-tag>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Box } from '@element-plus/icons-vue';
</script>

<style scoped lang="scss">

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-md $spacing-lg;
  background: $header-bg; // #556B2F 深橄榄绿色
  border-radius: 0; // 移除圆角
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.1); // 增强阴影和层次
  border: none; // 移除边框
  transition: $transition-base;
  position: relative;
  overflow: hidden;
  width: 100%; // 占满屏幕宽度
  max-width: 100%; // 确保不超出
  box-sizing: border-box; // 确保对齐
  margin: 0; // 移除外边距

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  }

  .logo {
    display: flex;
    align-items: center;
    gap: $spacing-md;

    .logo-icon {
      color: #ffffff;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
    }

    h1 {
      margin: 0;
      font-size: $font-size-h2;
      color: #ffffff;
      letter-spacing: -0.5px;
      font-weight: $font-weight-bold;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }
  }

  .help-text {
    display: flex;
    align-items: center;
  }
}
</style>
