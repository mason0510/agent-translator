import express from 'express'
import { getDB } from '../database/connection.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import type { AuthRequest } from '../middleware/auth.js'

const router = express.Router()

// 获取所有会员套餐
router.get('/plans',
  asyncHandler(async (req, res) => {
    const db = await getDB()

    const [rows] = await db.execute(`
      SELECT id, name, type, price, duration, translation_quota, 
             priority_support, features, created_at
      FROM membership_plans 
      WHERE is_active = true 
      ORDER BY price ASC
    `)

    const plans = (rows as any[]).map(plan => ({
      ...plan,
      features: JSON.parse(plan.features || '[]')
    }))

    res.json({
      success: true,
      data: plans
    })
  })
)

// 获取用户当前会员信息
router.get('/current',
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id
    const db = await getDB()

    const [rows] = await db.execute(`
      SELECT um.*, mp.name, mp.type, mp.price, mp.duration,
             mp.translation_quota, mp.priority_support, mp.features
      FROM user_memberships um
      JOIN membership_plans mp ON um.plan_id = mp.id
      WHERE um.user_id = ? AND um.is_active = true AND um.end_date > NOW()
      ORDER BY um.end_date DESC
      LIMIT 1
    `, [userId])

    const memberships = rows as any[]
    
    if (memberships.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'No active membership found'
      })
    }

    const membership = memberships[0]
    membership.features = JSON.parse(membership.features || '[]')

    res.json({
      success: true,
      data: membership
    })
  })
)

// 获取用户会员历史
router.get('/history',
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const offset = (page - 1) * limit

    const db = await getDB()

    // 获取会员历史记录
    const [rows] = await db.execute(`
      SELECT um.*, mp.name, mp.type, mp.price, mp.duration,
             mp.translation_quota, mp.priority_support, mp.features,
             po.amount, po.payment_method, po.paid_at
      FROM user_memberships um
      JOIN membership_plans mp ON um.plan_id = mp.id
      LEFT JOIN payment_orders po ON po.user_id = um.user_id AND po.plan_id = um.plan_id AND po.status = 'paid'
      WHERE um.user_id = ?
      ORDER BY um.start_date DESC
      LIMIT ? OFFSET ?
    `, [userId, limit, offset])

    // 获取总数
    const [countRows] = await db.execute(
      'SELECT COUNT(*) as total FROM user_memberships WHERE user_id = ?',
      [userId]
    )

    const total = (countRows as any[])[0].total

    const memberships = (rows as any[]).map(membership => ({
      ...membership,
      features: JSON.parse(membership.features || '[]')
    }))

    res.json({
      success: true,
      data: {
        memberships,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })
  })
)

// 获取用户会员使用统计
router.get('/usage',
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id
    const db = await getDB()

    // 获取当前会员信息
    const [membershipRows] = await db.execute(`
      SELECT um.*, mp.translation_quota
      FROM user_memberships um
      JOIN membership_plans mp ON um.plan_id = mp.id
      WHERE um.user_id = ? AND um.is_active = true AND um.end_date > NOW()
      ORDER BY um.end_date DESC
      LIMIT 1
    `, [userId])

    const memberships = membershipRows as any[]
    const currentMembership = memberships[0]

    // 获取本月使用统计
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
    const [usageRows] = await db.execute(
      'SELECT characters_used, translations_count FROM user_usage_stats WHERE user_id = ? AND month = ?',
      [userId, currentMonth]
    )

    const usage = (usageRows as any[])[0] || { characters_used: 0, translations_count: 0 }

    // 获取最近6个月的使用统计
    const [monthlyStatsRows] = await db.execute(`
      SELECT month, characters_used, translations_count
      FROM user_usage_stats 
      WHERE user_id = ? AND month >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 6 MONTH), '%Y-%m')
      ORDER BY month DESC
    `, [userId])

    const quota = currentMembership ? currentMembership.translation_quota : 1000
    const remainingQuota = quota === -1 ? -1 : Math.max(0, quota - usage.characters_used)

    res.json({
      success: true,
      data: {
        currentUsage: usage,
        quota,
        remainingQuota,
        monthlyStats: monthlyStatsRows,
        membershipActive: !!currentMembership,
        membershipExpiry: currentMembership ? currentMembership.end_date : null
      }
    })
  })
)

// 检查会员状态并更新过期的会员
router.post('/check-expiry',
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id
    const db = await getDB()

    // 更新过期的会员状态
    await db.execute(
      'UPDATE user_memberships SET is_active = false WHERE user_id = ? AND end_date <= NOW() AND is_active = true',
      [userId]
    )

    // 获取当前有效会员
    const [rows] = await db.execute(`
      SELECT um.*, mp.name, mp.type, mp.features
      FROM user_memberships um
      JOIN membership_plans mp ON um.plan_id = mp.id
      WHERE um.user_id = ? AND um.is_active = true AND um.end_date > NOW()
      ORDER BY um.end_date DESC
      LIMIT 1
    `, [userId])

    const memberships = rows as any[]
    const activeMembership = memberships.length > 0 ? memberships[0] : null

    if (activeMembership) {
      activeMembership.features = JSON.parse(activeMembership.features || '[]')
    }

    res.json({
      success: true,
      data: {
        hasActiveMembership: !!activeMembership,
        membership: activeMembership,
        message: activeMembership ? 'Membership is active' : 'No active membership'
      }
    })
  })
)

export default router