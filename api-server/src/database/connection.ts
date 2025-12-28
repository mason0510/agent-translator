import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

// 支持自定义环境变量文件
const envFile = process.env.ENV_FILE || '.env'
dotenv.config({ path: envFile })

let connection: mysql.Connection | null = null

export async function connectDB(): Promise<mysql.Connection> {
  if (connection) {
    return connection
  }

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'translator_agent',
      charset: 'utf8mb4',
      timezone: '+08:00'
    })

    console.log('✅ MySQL connected successfully')
    return connection
  } catch (error) {
    console.error('❌ MySQL connection failed:', error)
    throw error
  }
}

export async function getDB(): Promise<mysql.Connection> {
  if (!connection) {
    return await connectDB()
  }
  return connection
}

export async function closeDB(): Promise<void> {
  if (connection) {
    await connection.end()
    connection = null
    console.log('👋 MySQL connection closed')
  }
}