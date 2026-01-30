#!/usr/bin/env node
/**
 * 阿里云 OSS 自动部署脚本
 *
 * 使用方法：
 * 1. 安装依赖：npm install --save-dev ali-oss dotenv-cli
 * 2. 配置 .env.deploy 文件（参考 .env.deploy.example）
 * 3. 运行：npm run deploy
 */

import OSS from 'ali-oss'
import { readFileSync, readdir } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))

// 检查环境变量
const requiredEnvVars = [
  'OSS_REGION',
  'OSS_ACCESS_KEY_ID',
  'OSS_ACCESS_KEY_SECRET',
  'OSS_BUCKET'
]

const missingVars = requiredEnvVars.filter(varName => !process.env[varName])

if (missingVars.length > 0) {
  console.error('❌ 缺少必要的环境变量：')
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`)
  })
  console.error('\n请检查 .env.deploy 文件配置，参考 .env.deploy.example')
  process.exit(1)
}

// 检查 dist 目录是否存在
const distDir = join(__dirname, 'dist')
if (!existsSync(distDir)) {
  console.error('❌ dist 目录不存在，请先运行 npm run build')
  process.exit(1)
}

// 初始化 OSS 客户端
const client = new OSS({
  region: process.env.OSS_REGION,
  accessKeyId: process.env.OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
  bucket: process.env.OSS_BUCKET,
})

/**
 * 递归上传目录
 */
async function uploadDirectory(dirPath, ossPath = '') {
  const files = await readdir(dirPath, { withFileTypes: true })

  for (const file of files) {
    const fullPath = join(dirPath, file.name)
    const relativePath = join(ossPath, file.name).replace(/\\/g, '/')

    if (file.isDirectory()) {
      // 递归处理子目录
      await uploadDirectory(fullPath, relativePath)
    } else {
      // 上传文件
      await uploadFile(fullPath, relativePath)
    }
  }
}

/**
 * 上传单个文件
 */
async function uploadFile(filePath, ossPath) {
  try {
    // 读取文件内容
    const content = readFileSync(filePath)

    // 根据文件扩展名设置 Content-Type
    const contentType = getContentType(filePath)

    const result = await client.put(ossPath, content, {
      headers: {
        'Content-Type': contentType,
      },
    })

    console.log(`✅ ${ossPath}`)
    return result
  } catch (error) {
    console.error(`❌ 上传失败 ${ossPath}:`, error.message)
    throw error
  }
}

/**
 * 获取文件的 Content-Type
 */
function getContentType(filePath) {
  const ext = filePath.split('.').pop().toLowerCase()

  const contentTypes = {
    'html': 'text/html; charset=utf-8',
    'js': 'application/javascript; charset=utf-8',
    'css': 'text/css; charset=utf-8',
    'json': 'application/json; charset=utf-8',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'ttf': 'font/ttf',
    'eot': 'application/vnd.ms-fontobject',
  }

  return contentTypes[ext] || 'application/octet-stream'
}

/**
 * 主部署函数
 */
async function deploy() {
  try {
    console.log('🚀 开始部署到阿里云 OSS...\n')
    console.log(`📦 Bucket: ${process.env.OSS_BUCKET}`)
    console.log(`🌍 Region: ${process.env.OSS_REGION}\n`)

    console.log('📤 上传文件：')
    console.log('━'.repeat(50))

    // 上传 dist 目录的所有内容
    await uploadDirectory(distDir)

    console.log('━'.repeat(50))
    console.log('\n🎉 部署成功！\n')

    // 输出访问地址
    const bucket = process.env.OSS_BUCKET
    const region = process.env.OSS_REGION
    const endpoint = `http://${bucket}.${region}.aliyuncs.com`

    console.log('📍 访问地址：')
    console.log(`   ${endpoint}`)
    console.log('\n💡 提示：')
    console.log('   - 首次访问可能需要等待 1-2 分钟')
    console.log('   - 请确保 Bucket 已开启静态网站托管')
    console.log('   - 请确保 Bucket 权限设置为「公共读」')

  } catch (error) {
    console.error('\n❌ 部署失败：', error.message)
    console.error('\n请检查：')
    console.error('   1. .env.deploy 配置是否正确')
    console.error('   2. AccessKey 是否有权限')
    console.error('   3. Bucket 是否存在')
    console.error('   4. 网络连接是否正常')
    process.exit(1)
  }
}

// 执行部署
deploy()
