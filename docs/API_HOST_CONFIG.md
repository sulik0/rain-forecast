# 如何获取和配置 API Host

## 📋 什么是 API Host？

和风天气使用**自定义域名**作为 API Host，每个开发者都有自己专属的 Host 地址。

### URL 格式
```
https://{your-host}.qweatherapi.com/{version}/{path}?key={apiKey}
```

**示例：**
```
https://abcxyz.qweatherapi.com/v7/weather/now?key=xxx&location=101010100
        \_________/
          你的 Host
```

---

## 🔍 步骤 1: 获取你的 API Host

### 方法 A: 在控制台查看

1. **登录控制台**
   - 访问：https://console.qweather.com/
   - 使用你的账号登录

2. **进入应用设置**
   - 点击左侧菜单 **"项目管理"** 或 **"我的应用"**
   - 找到你的应用（Key: `a3de64eb28f5452ca64bcfbcf51d9935`）
   - 点击应用名称进入详情页

3. **查看 API Host**
   - 在应用详情页找到 **"API Host"** 或 **"域名"** 字段
   - 格式类似：`abcxyz.qweatherapi.com`
   - 复制这个 Host 地址

### 方法 B: 查看应用创建时的信息

如果你还记得创建应用时的信息：
- 创建应用时会显示你的专属 Host
- 格式通常是：`{随机字符串}.qweatherapi.com`

---

## ⚙️ 步骤 2: 配置到项目中

### 更新 .env 文件

打开项目的 `.env` 文件，找到这一行：

```env
VITE_QWEATHER_API_HOST=devapi.qweather.com
```

将其替换为你的实际 API Host：

```env
VITE_QWEATHER_API_HOST=你的Host.qweatherapi.com
```

**示例：**
如果你的 Host 是 `abcxyz123.qweatherapi.com`，则配置为：

```env
VITE_QWEATHER_API_HOST=abcxyz123.qweatherapi.com
```

---

## 🔄 步骤 3: 重启开发服务器

**重要**：修改环境变量后必须重启开发服务器！

```bash
# 1. 停止当前运行的服务（按 Ctrl+C）

# 2. 重新启动
npm run dev
```

环境变量只在启动时读取，运行中修改不会生效。

---

## ✅ 步骤 4: 验证配置

### 检查 URL

打开浏览器开发者工具（F12）:
1. 切换到 **Network** 标签
2. 点击应用中的"刷新数据"
3. 查看请求 URL

**正确的 URL 应该是：**
```
https://你的Host.qweatherapi.com/v7/weather/now?key=...&location=101010100
```

### 查看返回数据

如果配置正确，应该返回：
```json
{
  "code": "200",
  "updateTime": "2024-01-29T18:00+08:00",
  "now": {
    "temp": "5",
    "feelsLike": "3",
    ...
  }
}
```

---

## 📝 配置示例

### .env 文件完整示例

```env
# 和风天气 API 配置
# 请访问 https://console.qweather.com/ 获取你的 API Key 和 API Host

# API Key（必需）
VITE_QWEATHER_API_KEY=a3de64eb28f5452ca64bcfbcf51d9935

# API Host（必需）- 在控制台-设置中查看
# 格式：your-host.qweatherapi.com
VITE_QWEATHER_API_HOST=abcxyz123.qweatherapi.com

# API 版本（可选，默认 v7）
VITE_QWEATHER_API_VERSION=v7
```

---

## 🆘 常见问题

### Q1: 我找不到 API Host 在哪里？

**A:** API Host 通常在以下位置：
1. **控制台 - 应用详情页**：查看应用基本信息
2. **创建应用成功页面**：会显示你的 Host
3. **项目管理 - 应用列表**：可能直接显示

如果实在找不到，可以：
- 创建一个新应用，会重新生成 Host
- 联系和风天气技术支持

### Q2: 我的 Host 还是 `devapi.qweather.com`，能用吗？

**A:**
- 如果你是**免费版用户**，通常使用 `devapi.qweather.com`
- 如果你是**付费版用户**，会有专属的 `xxx.qweatherapi.com` Host
- 两种格式都支持，只需要在控制台确认你的实际 Host

### Q3: 配置后还是 403 错误？

**A:** 请检查：
1. ✅ API Key 是否正确
2. ✅ API Host 是否正确（完全匹配，不要有多余空格）
3. ✅ 是否重启了开发服务器（Ctrl+C 然后 `npm run dev`）
4. ✅ 控制台是否配置了域名白名单

### Q4: 免费版和付费版的 Host 有什么区别？

**A:**
- **免费版**：`devapi.qweather.com`（公共开发域名）
- **付费版**：`{your-host}.qweatherapi.com`（专属域名，性能更好）

---

## 🔗 相关文档

- [和风天气控制台](https://console.qweather.com/)
- [和风天气 API 文档](https://dev.qweather.com/docs/)
- [API 配置说明](https://dev.qweather.com/docs/configuration/api-config/)

---

## 💡 快速配置清单

- [ ] 登录 https://console.qweather.com/
- [ ] 找到你的应用并复制 API Host
- [ ] 更新 `.env` 文件中的 `VITE_QWEATHER_API_HOST`
- [ ] 保存文件
- [ ] 重启开发服务器（Ctrl+C 然后 `npm run dev`）
- [ ] 刷新浏览器并测试

完成！现在应该可以正常获取天气数据了。
