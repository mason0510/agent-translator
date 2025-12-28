#!/bin/bash

# 简化版本机启动脚本
# 直接连接远程MySQL和Redis

set -e

echo "🚀 启动本机开发环境（连接远程数据库）..."

# 选择环境变量文件 - 优先使用 .env 
ENV_FILE=".env"
if [ ! -f "$ENV_FILE" ]; then
    echo "⚠️ 未找到 $ENV_FILE，使用 .env.local 文件"
    ENV_FILE=".env.local"
fi

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ 错误: 环境变量文件不存在，请创建 $ENV_FILE"
    echo "💡 您可以复制 .env.local 作为模板"
    exit 1
fi

echo "📋 使用环境变量文件: $ENV_FILE"

# 安装依赖并构建
echo "📦 安装依赖..."

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

# 运行数据库迁移
echo "🔄 初始化数据库..."
cd api-server
ENV_FILE="../$ENV_FILE" npm run migrate
cd ..

echo "✅ 准备工作完成"

# 启动服务
echo "🚀 启动API服务..."
cd api-server
ENV_FILE="../$ENV_FILE" npm run dev &
API_PID=$!
cd ..

echo "⏳ 等待API服务启动..."
sleep 8

echo "🎨 启动前端服务..."
cd web-app
npm run dev &
WEB_PID=$!
cd ..

echo ""
echo "🎉 启动完成！"
echo ""
echo "📱 访问地址："
echo "   前端: http://localhost:3000"
echo "   API:  http://localhost:3001/health"
echo ""
echo "🛑 停止服务: 按 Ctrl+C"

# 等待中断信号
trap "echo ''; echo '🛑 停止服务...'; kill $API_PID $WEB_PID 2>/dev/null; exit 0" INT

wait