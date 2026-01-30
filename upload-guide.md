# 手动上传到阿里云 OSS 指南

由于自动部署脚本遇到兼容性问题，请使用以下手动方式上传文件。

## 方法一：通过阿里云控制台上传（推荐，最简单）

### 步骤：

1. **登录阿里云 OSS 控制台**
   - 访问：https://oss.console.aliyun.com/
   - 找到你的 Bucket：rain-forecast

2. **进入文件管理**
   - 点击 Bucket 名称进入详情
   - 点击左侧菜单「文件列表」

3. **上传文件**

   需要上传 `dist` 目录中的所有文件，结构如下：
   ```
   dist/
   ├── index.html
   └── assets/
       ├── index-XXX.css
       └── index-XXX.js
   ```

   具体操作：

   **上传 index.html：**
   - 点击「上传文件」
   - 选择 `dist/index.html`
   - 点击上传

   **创建 assets 目录并上传文件：**
   - 点击「新建目录」
   - 输入 `assets` 并创建
   - 进入 `assets` 目录
   - 点击「上传文件」
   - 同时选择 `dist/assets/` 下的所有文件（.css 和 .js）
   - 点击上传

4. **验证上传**
   - 上传完成后，文件列表应该显示：
     ```
     📄 index.html
     📁 assets/
       📄 index-BKpO78QF.css
       📄 index-D2mbKwRe.js
     ```

5. **访问网站**
   - 打开浏览器访问：http://rain-forecast.oss-cn-beijing.aliyuncs.com
   - 应该能看到降雨预警系统界面

---

## 方法二：使用阿里云 OSS 客户端（可选）

如果你希望更方便地上传，可以安装阿里云官方客户端：

### ossbrowser（图形界面工具）

1. **下载安装**
   - 访问：https://help.aliyun.com/document_detail/209974.html
   - 下载 macOS 版本
   - 解压并运行

2. **配置登录**
   - 选择「AccessKey」登录方式
   - 输入你的 AccessKey ID 和 Secret
   - 选择地域：华北2（北京）

3. **上传文件**
   - 找到 `rain-forecast` Bucket
   - 直接拖拽 `dist` 目录中的文件到浏览器窗口
   - 等待上传完成

---

## 方法三：使用 Cyberduck（免费第三方工具）

1. **下载 Cyberduck**
   - 访问：https://cyberduck.io/
   - 下载并安装 macOS 版本

2. **配置连接**
   - 打开 Cyberduck
   - 点击「+」新建连接
   - 连接类型选择：「Aliyun OSS」
   - Access Key ID：你的 AccessKey ID
   - Secret Access Key：你的 AccessKey Secret
   - 点击连接

3. **上传文件**
   - 找到 `rain-forecast` Bucket
   - 点击「上传」按钮
   - 选择 `dist` 目录下的所有文件
   - 等待上传完成

---

## 上传后的验证

访问以下地址确认部署成功：
```
http://rain-forecast.oss-cn-beijing.aliyuncs.com
```

应该能看到：
- 天气预警仪表盘界面
- 监控城市列表
- 统计卡片

---

## 常见问题

### 1. 上传后访问显示 404
- 检查 `index.html` 是否在根目录（不在 assets 目录内）
- 检查静态网站托管是否已开启

### 2. 样式丢失
- 检查 `assets/` 目录下是否有 CSS 和 JS 文件
- 确认文件名完整（无截断）

### 3. 如何更新网站
- 重复上述上传步骤
- 勾选「覆盖同名文件」选项（如果有的话）

---

## 需要帮助？

如果遇到问题，请检查：
1. Bucket 权限是否为「公共读」
2. 静态网站托管是否已开启
3. 文件路径是否正确（index.html 在根目录）
