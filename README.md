# Web Sokoban Pro

## 1 如何运行

### 方法 A: Docker（推荐）
本项目提供了生产就绪的 Docker 配置，支持 ARM 和 X86 架构。

1. **构建并运行：**
   ```bash
   docker-compose up -d --build
   ```
2. **访问：**
   打开浏览器访问 `http://localhost:8090`

### 方法 B: 本地开发
1. **安装依赖：**
   ```bash
   npm install
   ```
2. **运行开发服务器：**
   ```bash
   npm run dev
   ```
3. **访问：**
   访问 `http://localhost:5173`

## 2 服务

项目采用清晰的架构，包含以下服务/组件：

- **前端应用：** Vue 3（Composition API）+ TypeScript
- **UI 框架：** Element Plus（响应式、可访问性）
- **状态管理：** 响应式组合式函数（`useSokoban`）
- **托管服务：** Nginx（通过 Docker）

## 3 测试账号

此版本无需身份验证。游戏对所有用户开放。
*无需登录即可使用的功能：*
- 关卡选择
- 撤销/重置
- 键盘控制

## 4 题目内容

帮我生成一个web技术的推箱子游戏

---

## 项目结构

```
├── src/
│   ├── components/     # UI 组件（游戏板、控制面板、头部）
│   ├── composables/    # 游戏逻辑（状态、移动、规则）
│   ├── data/           # 关卡配置
│   ├── styles/         # 全局 SCSS 变量和样式
│   ├── types/          # TypeScript 接口
│   ├── App.vue         # 主布局
│   └── main.ts         # 入口文件
├── Dockerfile          # 多阶段构建定义
├── docker-compose.yml  # 容器编排
└── nginx.conf          # Web 服务器配置
```

## 功能特性

- 🎨 **视觉效果：** 简洁的卡片式 UI，柔和的阴影和统一的间距。
- 📱 **响应式设计：** 适配不同屏幕尺寸的自适应布局。
- ⌨️ **控制方式：** 支持鼠标（UI 按钮）和键盘（WASD/方向键）。
- ↩️ **撤销系统：** 无限撤销历史栈。
- 🏆 **胜利检测：** 自动验证胜利条件。
