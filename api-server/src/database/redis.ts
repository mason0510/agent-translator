import { createClient, RedisClientType } from 'redis'
import dotenv from 'dotenv'

// 支持自定义环境变量文件
const envFile = process.env.ENV_FILE || '.env'
dotenv.config({ path: envFile })

let client: RedisClientType | null = null

export async function connectRedis(): Promise<RedisClientType> {
  if (client && client.isOpen) {
    return client
  }

  try {
    client = createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
      },
      password: process.env.REDIS_PASSWORD || undefined
    })

    client.on('error', (err) => {
      console.error('Redis Client Error:', err)
    })

    client.on('connect', () => {
      console.log('✅ Redis connected successfully')
    })

    await client.connect()
    return client
  } catch (error) {
    console.error('❌ Redis connection failed:', error)
    throw error
  }
}

export async function getRedis(): Promise<RedisClientType> {
  if (!client || !client.isOpen) {
    return await connectRedis()
  }
  return client
}

export async function closeRedis(): Promise<void> {
  if (client && client.isOpen) {
    await client.quit()
    console.log('👋 Redis connection closed')
  }
}