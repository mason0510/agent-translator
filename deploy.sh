#!/bin/bash

# Translator Agent 部署脚本
# 用于部署到生产环境

set -e

echo "🚀 开始部署 Translator Agent..."

# 检查环境变量文件
if [ ! -f .env ]; then
    echo "❌ 错误: .env 文件不存在，请复制 .env.example 并配置"
    exit 1
fi

# 加载环境变量
source .env

# 检查必要的环境变量
REQUIRED_VARS=("JWT_SECRET" "OPENAI_API_KEY" "ZPAY_MERCHANT_ID" "ZPAY_SECRET_KEY")

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ 错误: 环境变量 $var 未设置"
        exit 1
    fi
done

echo "✅ 环境变量检查通过"

# 构建并启动服务
echo "🔨 构建 Docker 镜像..."
docker-compose -f docker-compose.prod.yml build --no-cache

echo "🗄️ 初始化数据库..."
# 等待MySQL服务启动
sleep 10

# 运行数据库迁移
docker run --rm \
  --network nginx-proxy \
  -e DB_HOST=mysql \
  -e DB_PORT=3306 \
  -e DB_USER=remote \
  -e DB_PASSWORD=zxc6545398 \
  -e DB_NAME=translator_agent \
  translator-agent_api:latest \
  tsx src/database/migrate.ts

echo "🚀 启动服务..."
docker-compose -f docker-compose.prod.yml up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 健康检查
echo "🔍 检查服务健康状态..."
API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" https://translator-api.aihang365.com/health || echo "000")
WEB_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" https://translator.aihang365.com || echo "000")

if [ "$API_HEALTH" = "200" ]; then
    echo "✅ API 服务运行正常"
else
    echo "❌ API 服务异常 (HTTP $API_HEALTH)"
fi

if [ "$WEB_HEALTH" = "200" ]; then
    echo "✅ Web 服务运行正常"
else
    echo "❌ Web 服务异常 (HTTP $WEB_HEALTH)"
fi

echo "🎉 部署完成！"
echo ""
echo "📱 访问地址："
echo "   Web: https://translator.aihang365.com"
echo "   API: https://translator-api.aihang365.com"
echo ""
echo "📊 查看日志："
echo "   docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "🛠️ 管理命令："
echo "   停止服务: docker-compose -f docker-compose.prod.yml down"
echo "   重启服务: docker-compose -f docker-compose.prod.yml restart"