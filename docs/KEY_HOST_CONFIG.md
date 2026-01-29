# 和风天气 API Key Host 配置指南

## ❌ 错误信息

如果你看到这个错误：

```json
{
    "error": {
        "status": 403,
        "type": "https://dev.qweather.com/docs/resource/error-code/#invalid-host",
        "title": "Invalid Host",
        "detail": "An invalid or unauthorized API Host."
    }
}
```

**原因**：API Key 配置了域名白名单，但你的当前访问域名不在白名单中。

---

## 🔧 解决方法

### 方法 1: 在控制台配置域名白名单（推荐）

#### 1. 登录控制台

访问：https://console.qweather.com/

#### 2. 进入应用管理

- 点击左侧菜单 **"项目管理"** 或 **"我的应用"**
- 找到 Key 为 `a3de64eb28f5452ca64bcfbcf51d9935` 的应用
- 点击应用名称进入详情页

#### 3. 配置域名

找到 **"域名白名单"** 或 **"Referer 设置"** 部分，添加以下域名之一：

**选项 A - 允许所有（仅用于测试）：**
```
*
```

**选项 B - 允许本地开发：**
```
http://localhost:5173
http://localhost:*
http://127.0.0.1:*
file://
```

**选项 C - 限制特定域名：**
```
http://localhost:5173
https://sulik0.github.io
```

#### 4. 保存并等待

- 点击 **保存** 或 **确定**
- 等待 **5-10 分钟**生效
- 刷新你的应用页面

---

### 方法 2: 创建新的应用（无域名限制）

如果现有应用无法修改，可以创建一个新应用：

#### 1. 创建新应用

在控制台点击 **"创建新应用"**：
- **应用名称**：降雨预警系统（本地开发）
- **应用类型**：Web API
- **KEY 类型**：免费版

#### 2. 配置域名

在域名白名单中输入：
```
*
```

或者：
```
http://localhost:*
http://127.0.0.1:*
```

#### 3. 获取新的 Key

创建后会生成新的 API Key，复制并替换到 `.env` 文件：

```env
VITE_QWEATHER_API_KEY=你的新Key
```

---

### 方法 3: 临时禁用 Host 验证

如果你是付费用户，可以在应用设置中找到：
- **"启用 Host 验证"** 开关
- 关闭此开关（不推荐，会降低安全性）

---

## 🧪 验证配置

配置完成后，使用测试工具验证：

### 方法 1: 使用浏览器测试工具

1. 打开 `test-api-direct.html`
2. 点击 **"测试免费版端点"**
3. 查看结果是否返回 200

### 方法 2: 使用 curl 测试

```bash
curl "https://devapi.qweather.com/v7/weather/now?key=a3de64eb28f5452ca64bcfbcf51d9935&location=101010100"
```

如果返回 `code: "200"`，说明配置成功。

---

## 📋 常见域名配置

### 本地开发

```
http://localhost:5173      # Vite 默认端口
http://localhost:3000      # 其他常见端口
http://127.0.0.1:5173
http://localhost:*         # 允许所有 localhost 端口
file://                    # 允许本地文件访问
```

### 生产环境

```
https://yourdomain.com
https://your-username.github.io
```

### 开发 + 生产

```
http://localhost:*
https://yourdomain.com
https://your-username.github.io
```

---

## ⚠️ 安全提示

1. **生产环境不要使用 `*`**
   - 允许所有域名会让任何人都能使用你的 API Key
   - 免费版配额会被他人消耗

2. **定期轮换 Key**
   - 如果怀疑 Key 泄露，在控制台重置
   - 创建新的 Key 并更新配置

3. **监控用量**
   - 在控制台查看 API 调用统计
   - 发现异常及时处理

---

## 🔗 相关链接

- [和风天气控制台](https://console.qweather.com/)
- [错误码说明 - Invalid Host](https://dev.qweather.com/docs/resource/error-code/#invalid-host)
- [API 配置文档](https://dev.qweather.com/docs/configuration/api-config/)
- [身份认证文档](https://dev.qweather.com/docs/configuration/authentication/)

---

## 💡 快速解决方案

如果你只是想快速测试，**最简单的方法**：

1. 访问 https://console.qweather.com/
2. 找到你的应用
3. 在域名白名单中添加：`*`
4. 保存并等待 5-10 分钟
5. 刷新应用页面

测试完成后，记得改成具体的域名！

---

## 🆘 还是不行？

如果配置后仍然 403，请检查：

1. ✅ 确认配置已保存
2. ✅ 等待 10 分钟让配置生效
3. ✅ 刷新应用页面（清除缓存）
4. ✅ 检查 API Key 是否正确复制
5. ✅ 确认使用的是开发版域名 `devapi.qweather.com`

如果还是不行，可能是 API Key 类型问题，确认你创建的是 **Web API** 类型的应用。
