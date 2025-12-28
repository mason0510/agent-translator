#!/bin/bash

# Translator Agent 本机开发环境启动脚本
# 使用远程MySQL和Redis服务

set -e

echo "🛠️ 启动本机开发环境..."

# 检查环境变量文件
if [ ! -f .env ]; then
    echo "❌ 错误: .env 文件不存在，请复制 .env.example 并配置"
    exit 1
fi

# 加载环境变量
source .env

# 检查Node.js版本
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt "20" ]; then
    echo "❌ 错误: 需要 Node.js 20 或更高版本，当前版本: $(node --version)"
    exit 1
fi

echo "✅ Node.js 版本检查通过: $(node --version)"

# 检查远程数据库连接
echo "🔍 检查远程数据库连接..."

# 测试MySQL连接
echo "📊 测试MySQL连接..."
mysql -h "${DB_HOST:-mysql}" -P "${DB_PORT:-3306}" -u "${DB_USER:-remote}" -p"${DB_PASSWORD:-zxc6545398}" -e "SELECT 1;" "${DB_NAME:-translator_agent}" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ MySQL连接成功"
else
    echo "❌ MySQL连接失败，请检查数据库配置"
    exit 1
fi

# 测试Redis连接 (如果有redis-cli)
if command -v redis-cli >/dev/null 2>&1; then
    echo "📦 测试Redis连接..."
    redis-cli -h "${REDIS_HOST:-redis}" -p "${REDIS_PORT:-6379}" -a "${REDIS_PASSWORD}" ping > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Redis连接成功"
    else
        echo "⚠️ Redis连接测试失败，但将继续启动（Redis可能配置了密码保护）"
    fi
else
    echo "⚠️ 未找到redis-cli，跳过Redis连接测试"
fi

# 安装翻译核心包依赖
echo "📦 安装翻译核心包依赖..."
cd packages/translator-core
if [ ! -d "node_modules" ] || [ ! -f "package-lock.json" ]; then
    npm install
fi
npm run build
cd ../..

# 安装API服务依赖
echo "🚀 安装API服务依赖..."
cd api-server
if [ ! -d "node_modules" ] || [ ! -f "package-lock.json" ]; then
    npm install
fi

# 运行数据库迁移
echo "🔄 运行数据库迁移..."
npm run migrate

echo "✅ 数据库迁移完成"
cd ..

# 安装前端依赖
echo "🎨 安装前端依赖..."
cd web-app
if [ ! -d "node_modules" ] || [ ! -f "package-lock.json" ]; then
    npm install --legacy-peer-deps
fi
cd ..

# 创建日志目录
mkdir -p logs

# 启动API服务（后台）
echo "🚀 启动API服务..."
cd api-server
npm run dev > ../logs/api.log 2>&1 &
API_PID=$!
echo "API服务进程ID: $API_PID"
cd ..

# 等待API服务启动
echo "⏳ 等待API服务启动..."
sleep 10

# 检查API服务健康状态
API_HEALTH=""
for i in {1..10}; do
    API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health 2>/dev/null || echo "000")
    if [ "$API_HEALTH" = "200" ]; then
        echo "✅ API服务启动成功"
        break
    fi
    echo "⏳ 等待API服务启动... ($i/10)"
    sleep 3
done

if [ "$API_HEALTH" != "200" ]; then
    echo "❌ API服务启动失败"
    echo "📋 API日志："
    tail -20 logs/api.log
    kill $API_PID 2>/dev/null
    exit 1
fi

# 启动前端服务（前台）
echo "🎨 启动前端服务..."
cd web-app
npm run dev &
WEB_PID=$!
echo "前端服务进程ID: $WEB_PID"
cd ..

# 等待前端服务启动
sleep 5

echo ""
echo "🎉 本机开发环境启动完成！"
echo ""
echo "📱 访问地址："
echo "   前端应用: http://localhost:3000"
echo "   API服务:  http://localhost:3001"
echo "   API健康检查: http://localhost:3001/health"
echo ""
echo "📊 数据库连接："
echo "   MySQL: ${DB_HOST:-mysql}:${DB_PORT:-3306}"
echo "   Redis: ${REDIS_HOST:-redis}:${REDIS_PORT:-6379}"
echo ""
echo "📋 日志文件："
echo "   API日志: tail -f logs/api.log"
echo "   前端控制台: 直接在当前终端查看"
echo ""
echo "🛑 停止服务："
echo "   按 Ctrl+C 停止前端服务"
echo "   API服务进程ID: $API_PID (使用 kill $API_PID 停止)"
echo ""

# 创建停止脚本
cat > stop-local-dev.sh << EOF
#!/bin/bash
echo "🛑 停止本机开发环境..."

# 停止API服务
if [ -n "$API_PID" ] && kill -0 $API_PID 2>/dev/null; then
    echo "停止API服务 (PID: $API_PID)..."
    kill $API_PID
fi

# 停止前端服务
if [ -n "$WEB_PID" ] && kill -0 $WEB_PID 2>/dev/null; then
    echo "停止前端服务 (PID: $WEB_PID)..."
    kill $WEB_PID
fi

# 清理进程
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "tsx.*src/index.ts" 2>/dev/null || true

echo "✅ 开发环境已停止"
EOF

chmod +x stop-local-dev.sh

# 设置信号处理
cleanup() {
    echo ""
    echo "🛑 收到停止信号，正在关闭服务..."
    kill $API_PID 2>/dev/null || true
    kill $WEB_PID 2>/dev/null || true
    pkill -f "npm run dev" 2>/dev/null || true
    pkill -f "tsx.*src/index.ts" 2>/dev/null || true
    echo "✅ 服务已停止"
    exit 0
}

trap cleanup SIGINT SIGTERM

# 保持脚本运行，等待用户中断
echo "💡 提示: 使用 Ctrl+C 停止所有服务，或运行 ./stop-local-dev.sh"
wait $WEB_PID