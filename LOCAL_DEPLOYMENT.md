# 本机开发环境部署指南

本指南介绍如何在本机启动开发环境，连接远程的MySQL和Redis服务。

## 🔧 环境准备

### 必要环境
- Node.js 20+
- MySQL客户端 (用于连接测试)
- Redis客户端 (可选，用于连接测试)

### 安装MySQL客户端 (macOS)
```bash
# 使用Homebrew安装
brew install mysql-client

# 或者安装完整的MySQL
brew install mysql
```

### 安装Redis客户端 (可选)
```bash
# 使用Homebrew安装
brew install redis
```

## 📋 配置步骤

### 1. 配置环境变量

复制本机环境变量模板：
```bash
cp .env.local .env
```

编辑 `.env` 文件，配置远程服务器连接信息：
```bash
# 远程MySQL配置
DB_HOST=your-mysql-host     # 替换为实际的MySQL服务器地址
DB_PORT=3306
DB_USER=remote
DB_PASSWORD=zxc6545398
DB_NAME=translator_agent

# 远程Redis配置  
REDIS_HOST=your-redis-host  # 替换为实际的Redis服务器地址
REDIS_PORT=6379
REDIS_PASSWORD=n(,fkR6X]o6E

# 填入你的OpenAI API Key
OPENAI_API_KEY=your-actual-openai-api-key

# 填入你的Z-Pay配置
ZPAY_MERCHANT_ID=your-zpay-merchant-id
ZPAY_SECRET_KEY=your-zpay-secret-key
ZPAY_WEBHOOK_SECRET=your-zpay-webhook-secret
```

### 2. 测试数据库连接

使用MySQL客户端测试连接：
```bash
mysql -h your-mysql-host -P 3306 -u remote -pzxc6545398 translator_agent
```

使用Redis客户端测试连接（如果已安装）：
```bash
redis-cli -h your-redis-host -p 6379 -a "n(,fkR6X]o6E" ping
```

## 🚀 启动方式

### 方式一：完整版启动脚本（推荐）
```bash
./local-dev.sh
```

特点：
- 自动检查环境和依赖
- 自动测试数据库连接
- 提供详细的启动日志
- 自动创建停止脚本

### 方式二：简化版启动脚本
```bash
./start-local.sh
```

特点：
- 更简洁的启动过程
- 支持自定义环境变量文件
- 适合快速开发

### 方式三：手动启动
如果脚本有问题，可以手动启动：

1. **安装依赖：**
```bash
# 翻译核心包
cd packages/translator-core
npm install && npm run build
cd ../..

# API服务
cd api-server  
npm install
cd ..

# 前端
cd web-app
npm install --legacy-peer-deps
cd ..
```

2. **运行数据库迁移：**
```bash
cd api-server
npm run migrate
cd ..
```

3. **启动API服务：**
```bash
cd api-server
npm run dev &
cd ..
```

4. **启动前端服务：**
```bash
cd web-app
npm run dev
```

## 📱 访问地址

启动成功后，可以通过以下地址访问：

- **前端应用**: http://localhost:3000
- **API服务**: http://localhost:3001  
- **API健康检查**: http://localhost:3001/health

## 🛑 停止服务

### 使用完整版脚本启动的
- 按 `Ctrl+C` 停止
- 或者运行: `./stop-local-dev.sh`

### 使用简化版脚本启动的
- 按 `Ctrl+C` 停止

### 手动停止
```bash
# 查找进程
ps aux | grep "npm run dev"

# 停止进程
kill <进程ID>

# 或者强制停止所有相关进程
pkill -f "npm run dev"
pkill -f "tsx.*src/index.ts"
```

## 🔍 故障排除

### 1. 数据库连接失败
- 检查网络连接
- 确认数据库服务器地址和端口
- 验证用户名和密码
- 确保数据库已创建

### 2. Redis连接失败
- Redis连接失败通常不会阻止应用启动
- 检查Redis服务器地址和端口
- 验证密码是否正确

### 3. 端口占用问题
```bash
# 检查端口占用
lsof -i :3000  # 前端端口
lsof -i :3001  # API端口

# 停止占用端口的进程
kill <进程ID>
```

### 4. 依赖安装问题
```bash
# 清理node_modules重新安装
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### 5. TypeScript编译错误
```bash
# 检查TypeScript版本
npx tsc --version

# 重新编译
npm run build
```

## 📋 日志查看

### API服务日志
```bash
tail -f logs/api.log
```

### 前端开发日志
前端日志直接显示在启动终端中

### 数据库操作日志
数据库操作错误会显示在API日志中

## 🔄 开发工作流

1. **修改代码** - 前端和API都支持热重载
2. **查看效果** - 浏览器自动刷新
3. **调试问题** - 查看控制台和日志文件
4. **测试功能** - 使用浏览器开发者工具

## 💡 开发提示

- 前端支持热重载，修改代码后自动刷新
- API服务使用tsx watch模式，修改后自动重启
- 使用浏览器开发者工具调试前端
- 使用API日志文件调试后端问题
- 数据库变更需要重新运行迁移脚本

---

如有问题，请检查日志文件或联系开发团队。