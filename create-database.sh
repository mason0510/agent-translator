#!/bin/bash

# 创建数据库脚本

set -e

echo "🗄️ 创建 translator_agent 数据库..."

# 从环境变量或默认值获取数据库配置
DB_HOST=${DB_HOST:-"82.29.54.32"}
DB_PORT=${DB_PORT:-"3306"}
DB_USER=${DB_USER:-"remote"}
DB_PASSWORD=${DB_PASSWORD:-"zxc6545398"}
DB_NAME=${DB_NAME:-"translator_agent"}

echo "连接到数据库服务器: $DB_HOST:$DB_PORT"
echo "使用用户: $DB_USER"

# 创建数据库
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "
CREATE DATABASE IF NOT EXISTS $DB_NAME 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
"

if [ $? -eq 0 ]; then
    echo "✅ 数据库 '$DB_NAME' 创建成功"
    
    # 验证数据库是否存在
    echo "🔍 验证数据库..."
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME; SELECT 'Database exists' AS status;"
    
    if [ $? -eq 0 ]; then
        echo "✅ 数据库验证成功"
    else
        echo "❌ 数据库验证失败"
        exit 1
    fi
else
    echo "❌ 数据库创建失败"
    exit 1
fi

echo ""
echo "🎉 数据库准备完成！"
echo "现在可以运行迁移脚本了：cd api-server && npm run migrate"