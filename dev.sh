#!/bin/bash

# Translator Agent 开发环境启动脚本

set -e

echo "🛠️ 启动开发环境..."

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ 错误: Docker 未运行，请先启动 Docker"
    exit 1
fi

# 启动基础服务 (MySQL, Redis)
echo "🗄️ 启动数据库服务..."
docker-compose up -d mysql redis

# 等待数据库启动
echo "⏳ 等待数据库启动..."
sleep 15

# 运行数据库迁移
echo "🔄 初始化数据库..."
cd api-server
npm install
npm run migrate
cd ..

# 启动 API 服务（开发模式）
echo "🚀 启动 API 服务..."
cd api-server
npm run dev &
API_PID=$!
cd ..

# 等待 API 服务启动
sleep 5

# 启动前端服务（开发模式）
echo "🎨 启动前端服务..."
cd web-app
npm install
npm run dev &
WEB_PID=$!
cd ..

echo "✅ 开发环境启动完成！"
echo ""
echo "📱 访问地址："
echo "   前端: http://localhost:3000"
echo "   API:  http://localhost:3001"
echo "   API健康检查: http://localhost:3001/health"
echo ""
echo "🛑 停止服务："
echo "   按 Ctrl+C 停止前端和API服务"
echo "   docker-compose down 停止数据库服务"
echo ""

# 等待中断信号
trap "kill $API_PID $WEB_PID; docker-compose down; exit" INT

# 保持脚本运行
wait