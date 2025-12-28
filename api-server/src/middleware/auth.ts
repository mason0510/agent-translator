import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { getDB } from '../database/connection.js'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    username: string
  }
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    
    // 验证用户是否存在
    const db = await getDB()
    const [rows] = await db.execute(
      'SELECT id, email, username FROM users WHERE id = ?',
      [decoded.userId]
    )

    const users = rows as any[]
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      })
    }

    req.user = users[0]
    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token.'
    })
  }
}

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
      
      const db = await getDB()
      const [rows] = await db.execute(
        'SELECT id, email, username FROM users WHERE id = ?',
        [decoded.userId]
      )

      const users = rows as any[]
      if (users.length > 0) {
        req.user = users[0]
      }
    }

    next()
  } catch (error) {
    // 忽略token验证错误，继续执行
    next()
  }
}