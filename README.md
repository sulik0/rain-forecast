# 降雨预警系统 | Rain Alert System

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-3178C6?logo=typescript)
![License](https://img.shields.io/badge/license-MIT-green)

智能整合多个天气数据源，精准预测降雨概率，及时推送预警通知

[功能特性](#功能特性) · [快速开始](#快速开始) · [技术栈](#技术栈) · [项目结构](#项目结构)

</div>

---

## 项目简介

降雨预警系统是一个现代化的天气监控应用，通过整合多个数据源（中国气象局、和风天气等），利用加权算法计算综合降雨概率，为用户提供精准的降雨预警服务。系统支持多城市同时监控，可配置预警阈值和推送通知，帮助用户提前做好出行准备。

### 核心亮点

- **多数据源聚合** - 整合中国气象局、和风天气等多个权威数据源
- **智能加权算法** - 可自定义各数据源权重，计算综合降雨概率
- **实时预警监控** - 支持多城市同时监控，实时刷新天气数据
- **灵活通知配置** - 自定义预警阈值，支持多个推送时间点
- **历史记录追踪** - 自动记录预警历史，便于回顾分析
- **现代化 UI** - 深色主题设计，响应式布局，支持移动端

---

## 功能特性

### 仪表盘 Dashboard
- 实时显示所有监控城市的天气状况
- 统计监控城市数、降雨预警数、晴好城市数
- 一键刷新天气数据
- 直观展示当前预警阈值

### 城市管理 Cities
- 支持添加/移除监控城市
- 内置 10 个主要城市（北京、上海、广州、深圳等）
- 搜索城市快速定位
- 至少保留一个城市的保护机制

### 数据源配置 Data Sources
- 支持多个数据源：中国气象局、和风天气
- 自定义数据源权重
- 启用/禁用数据源
- 一键归一化权重

### 通知配置 Notification
- 自定义预警阈值（0-100%）
- 配置多个推送时间点
- 支持微信推送（可配置 PushPlus Token）
- 可选择推送今日或明日天气

### 预警历史 History
- 自动记录所有预警事件
- 显示触发时间、城市、概率值
- 支持清空历史记录
- 保留最近 100 条记录

---

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0 或 pnpm >= 8.0.0

### 安装依赖

```bash
# 克隆项目
git clone https://github.com/your-username/rain-forecast.git
cd rain-forecast

# 安装依赖
npm install
# 或
pnpm install
```

### 开发模式

```bash
npm run dev
```

访问 [http://localhost:5173](http://localhost:5173) 查看应用

### 构建生产版本

```bash
npm run build
```

构建产物将生成在 `dist` 目录

### 预览生产构建

```bash
npm run preview
```

---

## 技术栈

### 前端框架
- **React 18.3** - 用户界面库
- **TypeScript 5.6** - 类型安全的 JavaScript 超集
- **Vite 6.0** - 下一代前端构建工具

### UI 框架
- **Tailwind CSS 3.4** - 原子化 CSS 框架
- **Lucide React** - 精美的图标库
- **PostCSS** - CSS 转换工具

### 代码规范
- **ESLint 9** - 代码质量检查工具
- **TypeScript ESLint** - TypeScript 语法检查

### 状态管理
- **React Hooks** - 内置状态管理
- **LocalStorage** - 本地数据持久化

---

## 项目结构

```
rain-forecast/
├── public/                 # 静态资源
│   └── rain.svg           # 网站图标
├── src/
│   ├── components/        # 可复用组件
│   │   ├── Sidebar.tsx    # 侧边导航栏
│   │   ├── Toast.tsx      # 通知提示组件
│   │   └── WeatherCard.tsx # 天气卡片组件
│   ├── hooks/            # 自定义 Hooks
│   │   ├── useToast.tsx   # Toast 通知 Hook
│   │   └── useStore.ts    # 状态管理 Hooks
│   ├── lib/              # 工具函数
│   │   └── utils.ts       # 通用工具函数
│   ├── pages/            # 页面组件
│   │   ├── Dashboard.tsx      # 仪表盘页面
│   │   ├── CitiesPage.tsx     # 城市管理页面
│   │   ├── DataSourcesPage.tsx # 数据源配置页面
│   │   ├── NotificationPage.tsx # 通知配置页面
│   │   └── HistoryPage.tsx    # 历史记录页面
│   ├── types/            # TypeScript 类型定义
│   │   └── index.ts       # 全局类型定义
│   ├── App.tsx           # 应用主组件
│   ├── main.tsx          # 应用入口
│   └── index.css         # 全局样式
├── index.html            # HTML 模板
├── package.json          # 项目配置
├── tsconfig.json         # TypeScript 配置
├── vite.config.ts        # Vite 配置
├── tailwind.config.ts    # Tailwind CSS 配置
└── postcss.config.js     # PostCSS 配置
```

---

## 配置说明

### 数据源配置

系统内置两个数据源：
1. **中国气象局 (CMA)** - 国家官方气象数据源
2. **和风天气 (QWeather)** - 商业天气 API

可在「数据源」页面自定义权重，权重总和会影响最终的概率计算。

### 预警阈值

默认预警阈值为 50%，当综合降雨概率超过此值时触发预警。可在「通知配置」页面调整。

### 通知推送

目前支持微信推送（通过 PushPlus），需要配置 Token。未来将支持更多推送渠道。

---

## 开发指南

### 添加新数据源

1. 在 `src/types/index.ts` 中添加数据源类型
2. 更新 `DEFAULT_DATA_SOURCES` 配置
3. 在 `src/hooks/useStore.ts` 中实现数据获取逻辑

### 添加新城市

在 `src/types/index.ts` 的 `PRESET_CITIES` 数组中添加城市信息：

```typescript
{
  id: 'tianjin',
  name: '天津',
  code: '101030100',
  province: '天津市'
}
```

### 自定义样式

主要样式定义在 `src/index.css` 中，使用 CSS 变量定义主题颜色：

```css
:root {
  --primary: 205 85% 55%;      /* 主色调 */
  --warning: 35 95% 55%;       /* 警告色 */
  --background: 215 30% 12%;   /* 背景色 */
  /* ... */
}
```

---

## 浏览器支持

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

---

## 路线图

- [ ] 接入真实天气 API（目前使用模拟数据）
- [ ] 支持更多数据源（AccuWeather、Weather.com 等）
- [ ] 添加邮件通知功能
- [ ] 添加短信通知功能
- [ ] 支持桌面通知（Web Push API）
- [ ] 添加降雨预报图表
- [ ] 支持用户账户系统
- [ ] 添加数据导出功能

---

## 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 联系方式

- 项目主页：[https://github.com/your-username/rain-forecast](https://github.com/your-username/rain-forecast)
- 问题反馈：[Issues](https://github.com/your-username/rain-forecast/issues)

---

<div align="center">

**如果这个项目对你有帮助，请给一个 Star ⭐**

Made with ❤️ by [Your Name]

</div>
