# 降雨预警系统部署指南

本文档介绍如何将降雨预警系统部署到对象存储服务上，实现公网访问。

## 目录

- [阿里云 OSS 部署](#阿里云-oss-部署)
- [腾讯云 COS 部署](#腾讯云-cos-部署)
- [配置自定义域名（可选）](#配置自定义域名可选)
- [自动部署脚本](#自动部署脚本)

---

## 阿里云 OSS 部署

### 1. 创建 Bucket

1. 登录 [阿里云控制台](https://oss.console.aliyun.com/)
2. 点击「创建 Bucket」
3. 配置 Bucket：
   - **Bucket 名称**：例如 `rain-forecast-yourname`
   - **地域**：选择距离你用户最近的地域（如华东、华北等）
   - **存储类型**：标准存储
   - **读写权限**：**公共读**（重要！）
   - **其他选项**：保持默认

### 2. 上传文件

**方式一：通过控制台上传**

1. 进入 Bucket 详情页
2. 点击「文件管理」→「上传文件」
3. 将 `dist` 目录下的所有文件上传：
   ```
   dist/
   ├── index.html
   └── assets/
       ├── index-*.css
       └── index-*.js
   ```

**方式二：使用 ossutil 命令行工具**

```bash
# 安装 ossutil
brew install ossutil

# 配置 ossutil
ossutil config

# 上传文件
ossutil cp -rf dist/ oss://your-bucket-name/ --update
```

### 3. 配置静态网站托管

1. 在 Bucket 概览页，找到「域名管理」
2. 点击「设置静态网站托管」
3. 配置如下：
   - 默认首页：`index.html`
   - 默认 404 页：`index.html`（支持前端路由）
4. 保存后，你会得到一个访问地址，例如：
   ```
   http://rain-forecast-yourname.oss-cn-hangzhou.aliyuncs.com
   ```

### 4. 访问测试

在浏览器中访问你的静态网站地址，确认能正常打开。

---

## 腾讯云 COS 部署

### 1. 创建存储桶

1. 登录 [腾讯云控制台](https://console.cloud.tencent.com/cos5)
2. 点击「创建存储桶」
3. 配置存储桶：
   - **存储桶名称**：例如 `rain-forecast-yourname`
   - **地域**：选择距离你用户最近的地域
   - **访问权限**：**公共读**（重要！）

### 2. 上传文件

**方式一：通过控制台上传**

1. 进入存储桶详情页
2. 点击「文件列表」→「上传文件」
3. 上传 `dist` 目录下的所有文件

**方式二：使用 COSCLI 命令行工具**

```bash
# 安装 COSCLI
brew install coscli

# 配置 COSCLI
coscli config

# 上传文件
coscli sync dist/ cos://your-bucket-name/ --delete
```

### 3. 配置静态网站

1. 在存储桶详情页，找到「基础配置」
2. 点击「静态网站」→「编辑」
3. 配置如下：
   - 索引文档：`index.html`
   - 错误文档：`index.html`
4. 开启静态网站，保存

### 4. 访问测试

你会得到一个访问地址，例如：
```
https://rain-forecast-yourname.cos.ap-guangzhou.myqcloud.com
```

---

## 配置自定义域名（可选）

### 阿里云 OSS

1. 在 Bucket 的「域名管理」中，点击「绑定域名」
2. 输入你的域名（例如 `weather.yourdomain.com`）
3. 选择「自动添加 CNAME 记录」
4. 在域名服务商处添加 CNAME 记录：
   ```
   类型: CNAME
   主机记录: weather
   记录值: rain-forecast-yourname.oss-cn-hangzhou.aliyuncs.com
   ```
5. 等待 DNS 生效后，通过自定义域名访问

### 腾讯云 COS

1. 在存储桶的「域名管理」中，点击「自定义域名」→「添加域名」
2. 输入你的域名，点击「保存」
3. 在域名服务商处添加 CNAME 记录：
   ```
   类型: CNAME
   主机记录: weather
   记录值: rain-forecast-yourname.cos.ap-guangzhou.myqcloud.com
   ```
4. 等待 DNS 生效后，通过自定义域名访问

### 配置 HTTPS（推荐）

**阿里云方式：**

1. 在 OSS Bucket 的「传输管理」中，点击「证书托管」
2. 上传你的 SSL 证书，或使用免费证书（阿里云提供）
3. 开启「强制 HTTPS」

**腾讯云方式：**

1. 在 COS 存储桶的「域名管理」中，找到你的域名
2. 点击「配置证书」
3. 上传 SSL 证书，或使用腾讯云免费证书
4. 开启 HTTPS 访问

---

## 自动部署脚本

如果你使用阿里云 OSS，可以使用以下脚本实现自动部署：

### 1. 安装依赖

```bash
npm install --save-dev ali-oss dotenv
```

### 2. 创建 `.env.deploy` 文件

```bash
# 阿里云 OSS 配置
OSS_REGION=oss-cn-hangzhou
OSS_ACCESS_KEY_ID=your_access_key_id
OSS_ACCESS_KEY_SECRET=your_access_key_secret
OSS_BUCKET=rain-forecast-yourname
```

**如何获取 Access Key：**
1. 访问 [阿里云 AccessKey 管理](https://ram.console.aliyun.com/manage/ak)
2. 创建 AccessKey
3. 保存 Access Key ID 和 Access Key Secret

### 3. 创建部署脚本 `deploy-oss.js`

```javascript
import OSS from 'ali-oss'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// 从环境变量读取配置
const client = new OSS({
  region: process.env.OSS_REGION,
  accessKeyId: process.env.OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
  bucket: process.env.OSS_BUCKET,
})

async function deploy() {
  try {
    console.log('🚀 开始部署到阿里云 OSS...')

    // 读取 index.html
    const indexHtml = readFileSync(join(__dirname, 'dist/index.html'), 'utf-8')

    // 上传 index.html
    await client.put('index.html', join(__dirname, 'dist/index.html'), {
      headers: {
        'Content-Type': 'text/html',
      },
    })
    console.log('✅ 上传 index.html')

    // 上传 assets 目录
    const assetsDir = join(__dirname, 'dist/assets')
    const { readdir } = await import('fs/promises')
    const files = await readdir(assetsDir)

    for (const file of files) {
      const filePath = join(assetsDir, file)
      const ossPath = `assets/${file}`

      await client.put(ossPath, filePath)
      console.log(`✅ 上传 ${ossPath}`)
    }

    console.log('\n🎉 部署成功！')
    console.log(`📍 访问地址: http://${process.env.OSS_BUCKET}.${process.env.OSS_REGION}.aliyuncs.com`)
  } catch (error) {
    console.error('❌ 部署失败:', error)
    process.exit(1)
  }
}

deploy()
```

### 4. 在 `package.json` 中添加部署命令

```json
{
  "scripts": {
    "deploy": "npm run build && dotenv -e .env.deploy -- node deploy-oss.js"
  }
}
```

### 5. 安装 dotenv-cli

```bash
npm install --save-dev dotenv-cli
```

### 6. 部署

```bash
npm run deploy
```

---

## 常见问题

### 1. 上传后无法访问？

检查以下几点：
- Bucket/存储桶的权限是否设置为「公共读」
- 是否已开启静态网站托管
- 文件是否正确上传到根目录
- 检查防火墙或安全组设置

### 2. 刷新后出现 404？

确保静态网站的 404 页面配置为 `index.html`，以支持前端路由。

### 3. API Key 配置问题？

创建 `.env.production` 文件（不要提交到 Git）：

```bash
VITE_QWEATHER_API_KEY=your_production_api_key
VITE_QWEATHER_API_VERSION=v7
```

重新构建：
```bash
npm run build
```

### 4. 跨域问题？

如果需要从其他域名访问，在 OSS/COS 控制台配置 CORS 规则：

**阿里云：**
- 进入 Bucket → 权限管理 → 跨域设置
- 添加规则：
  - 来源：`*`（或指定域名）
  - 允许 Methods：GET, HEAD
  - 允许 Headers：`*`

**腾讯云：**
- 进入存储桶 → 安全管理 → CORS 规则
- 添加相同规则

---

## 成本估算

### 阿里云 OSS

- **存储费用**：约 ¥0.12/GB/月
- **请求费用**：¥0.01/万次（GET 请求）
- **流量费用**：¥0.5/GB（外网下行流量）

**估算**（假设每天 1000 次访问）：
- 存储：0.5 MB × ¥0.12/GB = 几乎免费
- 请求：3万次/月 × ¥0.01/万次 = ¥0.3/月
- 流量：0.5 MB × 1000 × 30 × ¥0.5/GB ≈ ¥7.5/月
- **总计**：约 ¥8/月

### 腾讯云 COS

价格类似，具体查看官方定价。

---

## 安全建议

1. **不要将 `.env` 文件上传到 Git**（已在 `.gitignore` 中）
2. **定期更换 Access Key**
3. **开启 HTTPS** 保护数据传输
4. **配置访问日志** 监控异常访问
5. **设置防盗链** 防止资源被其他网站引用

---

## 更新部署

每次更新代码后，执行以下步骤：

```bash
# 1. 构建新版本
npm run build

# 2. 上传到 OSS/COS
# 方式一：使用自动部署脚本
npm run deploy

# 方式二：手动上传控制台
# 重新上传 dist 目录下的所有文件

# 方式三：使用命令行工具
# 阿里云
ossutil cp -rf dist/ oss://your-bucket-name/ --update

# 腾讯云
coscli sync dist/ cos://your-bucket-name/ --delete
```

---

## 相关链接

- [阿里云 OSS 文档](https://help.aliyun.com/product/31815.html)
- [腾讯云 COS 文档](https://cloud.tencent.com/document/product/436)
- [和风天气 API 文档](https://dev.qweather.com/docs/)f
