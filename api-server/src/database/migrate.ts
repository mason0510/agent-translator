#!/usr/bin/env tsx

import dotenv from 'dotenv'
import { connectDB } from './connection.js'

// 支持自定义环境变量文件
const envFile = process.env.ENV_FILE || '.env'
dotenv.config({ path: envFile })

console.log(`📋 Using environment file: ${envFile}`)

const createTables = async () => {
  const db = await connectDB()

  try {
    // 创建用户表
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        avatar VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_username (username)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // 创建会员套餐表
    await db.execute(`
      CREATE TABLE IF NOT EXISTS membership_plans (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        name VARCHAR(50) NOT NULL,
        type ENUM('basic', 'premium', 'enterprise') NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        duration INT NOT NULL COMMENT 'Duration in days',
        translation_quota INT NOT NULL COMMENT '-1 for unlimited',
        priority_support BOOLEAN DEFAULT FALSE,
        features JSON,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // 创建用户会员记录表
    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_memberships (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        user_id VARCHAR(36) NOT NULL,
        plan_id VARCHAR(36) NOT NULL,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (plan_id) REFERENCES membership_plans(id),
        INDEX idx_user_id (user_id),
        INDEX idx_active (is_active),
        INDEX idx_end_date (end_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // 创建支付订单表
    await db.execute(`
      CREATE TABLE IF NOT EXISTS payment_orders (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        user_id VARCHAR(36) NOT NULL,
        plan_id VARCHAR(36) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'CNY',
        status ENUM('pending', 'paid', 'failed', 'cancelled', 'refunded') DEFAULT 'pending',
        payment_method VARCHAR(50),
        payment_provider VARCHAR(50),
        provider_order_id VARCHAR(100),
        provider_payment_id VARCHAR(100),
        paid_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (plan_id) REFERENCES membership_plans(id),
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_provider_order_id (provider_order_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // 创建翻译记录表
    await db.execute(`
      CREATE TABLE IF NOT EXISTS translation_requests (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        user_id VARCHAR(36),
        source_text TEXT NOT NULL,
        target_text TEXT,
        source_lang VARCHAR(10) NOT NULL,
        target_lang VARCHAR(10) NOT NULL,
        type ENUM('text', 'file', 'url') DEFAULT 'text',
        character_count INT DEFAULT 0,
        status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // 创建用户使用统计表
    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_usage_stats (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        user_id VARCHAR(36) NOT NULL,
        month VARCHAR(7) NOT NULL COMMENT 'YYYY-MM format',
        characters_used INT DEFAULT 0,
        translations_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_month (user_id, month),
        INDEX idx_user_id (user_id),
        INDEX idx_month (month)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    console.log('✅ Database tables created successfully')

    // 插入默认会员套餐
    await db.execute(`
      INSERT IGNORE INTO membership_plans (id, name, type, price, duration, translation_quota, priority_support, features) VALUES
      ('basic-plan', '基础版', 'basic', 29.00, 30, 10000, false, '["每月10,000字翻译额度", "支持文本翻译", "基础客服支持", "多语言支持"]'),
      ('premium-plan', '专业版', 'premium', 99.00, 30, 50000, true, '["每月50,000字翻译额度", "支持文本、文件、网页翻译", "优先客服支持", "多语言支持", "翻译历史记录", "批量翻译功能"]'),
      ('enterprise-plan', '企业版', 'enterprise', 299.00, 30, -1, true, '["无限翻译额度", "支持所有翻译类型", "专属客服支持", "多语言支持", "翻译历史记录", "批量翻译功能", "API接口调用", "团队协作功能"]')
    `)

    console.log('✅ Default membership plans inserted')

  } catch (error) {
    console.error('❌ Database migration failed:', error)
    throw error
  }
}

// 运行迁移
if (import.meta.url === `file://${process.argv[1]}`) {
  createTables()
    .then(() => {
      console.log('🎉 Database migration completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Database migration failed:', error)
      process.exit(1)
    })
}

export { createTables }