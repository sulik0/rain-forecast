# 天气 API 配置指南

本文档介绍如何配置和风天气 API，使降雨预警系统能够获取真实的天气数据。

## 目录

- [和风天气 API 简介](#和风天气-api-简介)
- [注册和获取 API Key](#注册和获取-api-key)
- [配置环境变量](#配置环境变量)
- [测试 API 连接](#测试-api-连接)
- [常见问题](#常见问题)
- [免费版限制](#免费版限制)

---

## 和风天气 API 简介

和风天气（QWeather）是中国领先的商业气象服务提供商，提供全球天气数据服务。

### 主要特性

- 🌍 **全球覆盖** - 支持全球城市天气数据
- 📊 **数据丰富** - 实时天气、天气预报、空气质量等
- ⚡ **高可用性** - 99.9% 服务可用性保障
- 🔒 **安全可靠** - HTTPS 加密传输

### 本项目使用的 API

1. **天气预报 API (3天)** - 获取未来 3 天天气预报
2. **实时天气 API** - 获取当前实时天气状况

官方文档：https://dev.qweather.com/docs/

---

## 注册和获取 API Key

### 步骤 1：注册账号

1. 访问 [和风天气开发者平台](https://dev.qweather.com/)
2. 点击右上角「控制台」
3. 使用手机号或邮箱注册账号

### 步骤 2：创建应用

1. 登录后进入「控制台」
2. 点击「创建项目」
3. 填写项目信息：
   - **项目名称**：降雨预警系统（或自定义名称）
   - **应用类型**：Web 端
   - **选择 KEY 类型**：免费版（WebAPI）

### 步骤 3：获取 API Key

1. 创建成功后，在「项目管理」中找到你的项目
2. 复制「KEY」一栏中的密钥
3. **重要**：请妥善保管你的 API Key，不要泄露给他人

![示例](https://dev.qweather.com/help/images/key.png)

---

## 配置环境变量

### 方式 1：使用 .env 文件（推荐）

1. 复制 `.env.example` 文件并重命名为 `.env`：

```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，替换 API Key：

```env
# 将 your_qweather_api_key_here 替换为你的真实 API Key
VITE_QWEATHER_API_KEY=your_actual_api_key_here
VITE_QWEATHER_API_VERSION=v7
```

### 方式 2：直接编辑 .env 文件

如果项目中已有 `.env` 文件，直接编辑即可：

```bash
# 使用你喜欢的编辑器打开 .env
nano .env
# 或
vim .env
# 或
code .env
```

### 方式 3：在命令行中设置（临时）

```bash
# macOS/Linux
export VITE_QWEATHER_API_KEY=your_actual_api_key_here

# Windows PowerShell
$env:VITE_QWEATHER_API_KEY="your_actual_api_key_here"
```

**注意**：命令行方式只在当前会话有效，关闭终端后会失效。

---

## 测试 API 连接

配置完成后，测试 API 是否正常工作：

### 方法 1：启动应用测试

```bash
# 安装依赖（如果还没安装）
npm install

# 启动开发服务器
npm run dev
```

打开浏览器访问 http://localhost:5173，点击「刷新数据」按钮。

检查方式：
- 打开浏览器开发者工具（F12）
- 查看 Console 标签页
- 如果看到真实天气数据，说明配置成功
- 如果看到警告信息，检查 API Key 是否正确

### 方法 2：使用 curl 测试

```bash
curl "https://devapi.qweather.com/v7/weather/3d?key=YOUR_API_KEY&location=101010100"
```

返回 JSON 数据中 `code` 为 `"200"` 表示成功：

```json
{
  "code": "200",
  "updateTime": "2024-01-15T10:00+08:00",
  "fxLink": "https://www.qweather.com/weather/beijing-101010100.html",
  "daily": [
    {
      "fxDate": "2024-01-15",
      "tempMax": "5",
      "tempMin": "-5",
      "textDay": "晴",
      "iconDay": "100",
      "precip": "0.0",
      "pop": "12"
    }
  ]
}
```

### 方法 3：使用 Postman 测试

1. 下载 [Postman](https://www.postman.com/downloads/)
2. 创建新的 GET 请求
3. URL：`https://devapi.qweather.com/v7/weather/3d?key=YOUR_API_KEY&location=101010100`
4. 发送请求，查看返回结果

---

## 常见问题

### Q1: 提示 "未配置和风天气 API Key"

**解决方法**：
- 检查 `.env` 文件是否存在
- 确认 `VITE_QWEATHER_API_KEY` 的值不是 `your_qweather_api_key_here`
- 确保 `.env` 文件在项目根目录

### Q2: API 返回错误代码

| 错误代码 | 含义 | 解决方法 |
|---------|------|---------|
| 204 | 请求成功，但无数据 | 检查城市代码是否正确 |
| 400 | 请求错误 | 检查 API 参数格式 |
| 401 | 认证失败 | API Key 错误或已过期 |
| 402 | 超过配额 | 升级套餐或等待次日重置 |
| 403 | 无权限 | 检查 API Key 类型是否正确 |
| 404 | 无数据 | 检查城市代码是否存在 |

### Q3: 数据更新延迟

和风天气免费版的数据更新频率：
- **实时天气**：约 20-60 分钟更新一次
- **天气预报**：每天更新 1-2 次

如需更高频率，请升级到付费版。

### Q4: 城市代码查询

和风天气使用「城市ID」或「经纬度」查询天气。

**常用城市代码**：

| 城市 | 城市代码 |
|-----|---------|
| 北京 | 101010100 |
| 上海 | 101020100 |
| 广州 | 101280101 |
| 深圳 | 101280601 |
| 杭州 | 101210101 |
| 成都 | 101270101 |

查询更多城市：https://github.com/qwd/LocationList

---

## 免费版限制

和风天气免费版（WebAPI）的限制：

### 配额限制

- **每天请求次数**：1,000 次/天
- **并发请求**：无限制
- **数据更新频率**：约 20-60 分钟

### 功能限制

- ✅ 实时天气
- ✅ 3 天天气预报
- ✅ 空气质量
- ✅ 灾害预警
- ❌ 7-15 天天气预报（需付费）
- ❌ 历史天气（需付费）
- ❌ 卫星云图（需付费）

### 超出配额后

当天的免费配额用完后：
- API 会返回错误代码 `402`
- 需要等待次日 00:00 配额重置
- 或升级到付费版本

升级套餐：https://dev.qweather.com/pricing/

---

## 开发调试技巧

### 查看真实 API 请求

在浏览器开发者工具的 Network 标签页中：

1. 刷新天气数据
2. 筛选 `devapi.qweather.com` 请求
3. 查看请求参数和响应数据

### 模拟数据模式

如果暂时不想使用真实 API，可以在 `src/hooks/useStore.ts` 中修改：

```typescript
const [useRealApi, setUseRealApi] = useState(false) // 改为 false 使用模拟数据
```

### 添加更多城市

在 `src/types/index.ts` 的 `PRESET_CITIES` 数组中添加：

```typescript
{
  id: 'tianjin',
  name: '天津',
  code: '101030100',  // 和风天气城市代码
  province: '天津市'
}
```

---

## 相关资源

- **和风天气官方文档**：https://dev.qweather.com/docs/
- **和风天气控制台**：https://console.qweather.com/
- **城市代码查询**：https://github.com/qwd/LocationList
- **定价页面**：https://dev.qweather.com/pricing/
- **常见问题**：https://dev.qweather.com/help/

---

## 安全建议

1. **不要将 API Key 提交到 Git**
   - `.env` 文件已在 `.gitignore` 中
   - 提交代码前检查：`git status`

2. **定期更换 API Key**
   - 如果怀疑 Key 泄露，立即在控制台重置

3. **使用环境变量**
   - 生产环境使用服务器端环境变量
   - 不要在前端代码中硬编码 API Key

4. **监控 API 使用量**
   - 定期查看控制台的用量统计
   - 避免超出免费配额

---

如有其他问题，请访问 [和风天气开发者社区](https://dev.qweather.com/help/) 或提交 Issue。
