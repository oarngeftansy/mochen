# 切水果游戏 / Fruit Slicing Game

一个有趣的音游风格切水果游戏，使用 React + Tailwind CSS + Motion 构建。

## 🚀 快速开始

### 前置要求
- Node.js (推荐 v18 或更高版本)
- pnpm (推荐使用 pnpm，也可以用 npm 或 yarn)

如果没有安装 pnpm，运行：
```bash
npm install -g pnpm
```

### 安装步骤

1. **解压下载的文件**
   - 将下载的压缩包解压到你想要的目录

2. **打开终端/命令提示符**
   - Windows: 按 `Win + R`，输入 `cmd` 回车
   - Mac: 按 `Cmd + Space`，输入 `terminal` 回车
   - 或使用 VS Code 等编辑器的内置终端

3. **进入项目目录**
   ```bash
   cd 你的解压路径/my-make-file
   ```

4. **安装依赖包**（如果 node_modules 文件夹不存在或需要重新安装）
   ```bash
   pnpm install
   ```
   
   如果使用 npm：
   ```bash
   npm install
   ```

5. **启动开发服务器**
   ```bash
   pnpm run dev
   ```
   
   如果使用 npm：
   ```bash
   npm run dev
   ```

6. **在浏览器中打开**
   - 终端会显示类似这样的信息：
     ```
     Local: http://localhost:5173
     ```
   - 在浏览器中打开 `http://localhost:5173` 即可开始游戏！

## 🎮 游戏玩法

1. **开始界面** - 点击"开始游戏"按钮
2. **传送带模式（音游）**
   - 按空格键收集食材
   - 快速按：收集 TAP 类型食材
   - 长按：收集 HOLD 类型食材
   - 在判定圈中按下以获得 Perfect/Good 评分
3. **加工台模式**
   - 用鼠标在切菜板上划线切割食材
   - 横切、竖切、斜切会有不同效果
   - 切够3片后可以选择切片进行摆盘
4. **结果界面** - 查看你的完成成果

## 📁 项目结构

```
my-make-file/
├── src/
│   ├── app/
│   │   ├── App.tsx              # 主应用组件
│   │   ├── components/
│   │   │   ├── StartScreen.tsx       # 开始界面
│   │   │   ├── ConveyorMode.tsx      # 传送带模式（音游）
│   │   │   ├── ProcessingMode.tsx    # 加工台模式
│   │   │   ├── ResultsScreen.tsx     # 结果界面
│   │   │   └── LanguageToggle.tsx    # 语言切换按钮
│   │   └── contexts/
│   │       └── LanguageContext.tsx   # 多语言上下文
│   └── styles/
│       ├── fonts.css            # 字体样式
│       ├── theme.css            # 主题配置
│       └── ...
├── package.json                 # 依赖配置
├── vite.config.ts              # Vite 配置
└── README.md                   # 本文件
```

## 🛠️ 技术栈

- **React 18.3** - UI 框架
- **TypeScript** - 类型安全
- **Tailwind CSS v4** - 样式框架
- **Motion (Framer Motion)** - 动画库
- **Vite** - 构建工具

## 📝 自定义配置

### 修改音效和图片

在以下文件中找到配置并替换为你的 URL：

- `src/app/components/ConveyorMode.tsx` - 第39-56行（食材图片和音效）
- `src/app/components/ProcessingMode.tsx` - 第34-63行（加工台图片和音效）

### 修改背景音乐

在 `src/app/App.tsx` 第18-22行：
```typescript
const BGM_URLS = {
  conveyor: '你的传送带音乐URL',
  processing: '你的加工台音乐URL',
};
```

## 🔧 常见问题

**Q: 运行 pnpm install 时报错？**
A: 尝试删除 `node_modules` 文件夹和 `pnpm-lock.yaml`，然后重新运行 `pnpm install`

**Q: 端口 5173 被占用？**
A: 可以在 `vite.config.ts` 中修改端口，或关闭占用该端口的程序

**Q: 游戏没有声音？**
A: 需要在代码中配置有效的音频文件 URL（默认使用占位符）

## 📦 构建生产版本

```bash
pnpm run build
```

构建完成后，`dist` 文件夹中的内容可以部署到任何静态网站托管服务。

## 🌐 语言切换

游戏支持中文/英文双语，点击右上角的语言切换按钮即可切换。

---

享受游戏！🎉
