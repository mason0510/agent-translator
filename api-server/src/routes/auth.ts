import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { body, validationResult } from 'express-validator'
import { getDB } from '../database/connection.js'
import { asyncHandler, createError } from '../middleware/errorHandler.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'

const router = express.Router()

// 用户注册
router.post('/register',
  [
    body('username')
      .isLength({ min: 2, max: 20 })
      .withMessage('Username must be between 2 and 20 characters'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw createError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400)
    }

    const { username, email, password } = req.body
    const db = await getDB()

    // 检查用户是否已存在
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    )

    const users = existingUsers as any[]
    if (users.length > 0) {
      throw createError('User with this email or username already exists', 400)
    }

    // 加密密码
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // 创建用户
    const [result] = await db.execute(`
      INSERT INTO users (username, email, password_hash)
      VALUES (?, ?, ?)
    `, [username, email, passwordHash])

    const insertResult = result as any
    const userId = insertResult.insertId

    // 获取新创建的用户信息
    const [newUserRows] = await db.execute(
      'SELECT id, username, email, created_at FROM users WHERE id = ?',
      [userId]
    )

    const newUsers = newUserRows as any[]
    const user = newUsers[0]

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: user
    })
  })
)

// 用户登录
router.post('/login',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw createError('Validation failed', 400)
    }

    const { email, password } = req.body
    const db = await getDB()

    // 查找用户
    const [userRows] = await db.execute(
      'SELECT id, username, email, password_hash, created_at FROM users WHERE email = ?',
      [email]
    )

    const users = userRows as any[]
    if (users.length === 0) {
      throw createError('Invalid email or password', 401)
    }

    const user = users[0]

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password_hash)
    if (!isPasswordValid) {
      throw createError('Invalid email or password', 401)
    }

    // 生成JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    )

    // 生成refresh token
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    )

    // 移除密码哈希
    delete user.password_hash

    // 获取用户会员信息
    const [membershipRows] = await db.execute(`
      SELECT um.*, mp.name, mp.type, mp.features, mp.translation_quota, mp.priority_support
      FROM user_memberships um
      JOIN membership_plans mp ON um.plan_id = mp.id
      WHERE um.user_id = ? AND um.is_active = true AND um.end_date > NOW()
      ORDER BY um.end_date DESC
      LIMIT 1
    `, [user.id])

    const memberships = membershipRows as any[]
    if (memberships.length > 0) {
      user.membership = {
        id: memberships[0].plan_id,
        name: memberships[0].name,
        type: memberships[0].type,
        features: JSON.parse(memberships[0].features || '[]'),
        isActive: true,
        expiryDate: memberships[0].end_date,
        translationQuota: memberships[0].translation_quota,
        prioritySupport: memberships[0].priority_support
      }
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token,
        refreshToken
      }
    })
  })
)

// 获取用户信息
router.get('/profile',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id
    const db = await getDB()

    const [userRows] = await db.execute(
      'SELECT id, username, email, avatar, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    )

    const users = userRows as any[]
    if (users.length === 0) {
      throw createError('User not found', 404)
    }

    const user = users[0]

    // 获取用户会员信息
    const [membershipRows] = await db.execute(`
      SELECT um.*, mp.name, mp.type, mp.features, mp.translation_quota, mp.priority_support
      FROM user_memberships um
      JOIN membership_plans mp ON um.plan_id = mp.id
      WHERE um.user_id = ? AND um.is_active = true AND um.end_date > NOW()
      ORDER BY um.end_date DESC
      LIMIT 1
    `, [userId])

    const memberships = membershipRows as any[]
    if (memberships.length > 0) {
      user.membership = {
        id: memberships[0].plan_id,
        name: memberships[0].name,
        type: memberships[0].type,
        features: JSON.parse(memberships[0].features || '[]'),
        isActive: true,
        expiryDate: memberships[0].end_date,
        translationQuota: memberships[0].translation_quota,
        prioritySupport: memberships[0].priority_support
      }
    }

    res.json({
      success: true,
      data: user
    })
  })
)

// 更新用户信息
router.put('/profile',
  authMiddleware,
  [
    body('username')
      .optional()
      .isLength({ min: 2, max: 20 })
      .withMessage('Username must be between 2 and 20 characters'),
    body('avatar')
      .optional()
      .isURL()
      .withMessage('Avatar must be a valid URL')
  ],
  asyncHandler(async (req: AuthRequest, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw createError('Validation failed', 400)
    }

    const userId = req.user!.id
    const { username, avatar } = req.body
    const db = await getDB()

    const updateFields: string[] = []
    const updateValues: any[] = []

    if (username) {
      // 检查用户名是否已被使用
      const [existingUsers] = await db.execute(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, userId]
      )
      const users = existingUsers as any[]
      
      if (users.length > 0) {
        throw createError('Username already taken', 400)
      }

      updateFields.push('username = ?')
      updateValues.push(username)
    }

    if (avatar !== undefined) {
      updateFields.push('avatar = ?')
      updateValues.push(avatar)
    }

    if (updateFields.length === 0) {
      throw createError('No fields to update', 400)
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP')
    updateValues.push(userId)

    await db.execute(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    )

    // 返回更新后的用户信息
    const [userRows] = await db.execute(
      'SELECT id, username, email, avatar, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    )

    const users = userRows as any[]
    const user = users[0]

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    })
  })
)

// 刷新token
router.post('/refresh',
  [
    body('refreshToken')
      .notEmpty()
      .withMessage('Refresh token is required')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw createError('Validation failed', 400)
    }

    const { refreshToken } = req.body

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any
      
      // 验证用户是否存在
      const db = await getDB()
      const [userRows] = await db.execute(
        'SELECT id, email FROM users WHERE id = ?',
        [decoded.userId]
      )

      const users = userRows as any[]
      if (users.length === 0) {
        throw createError('Invalid refresh token', 401)
      }

      const user = users[0]

      // 生成新的access token
      const newToken = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      )

      res.json({
        success: true,
        data: {
          token: newToken
        }
      })

    } catch (error) {
      throw createError('Invalid refresh token', 401)
    }
  })
)

export default router