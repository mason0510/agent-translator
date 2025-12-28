import express from 'express'
import { body, param, validationResult } from 'express-validator'
import { getDB } from '../database/connection.js'
import { ZPayService } from '../services/zpay.js'
import { asyncHandler, createError } from '../middleware/errorHandler.js'
import type { AuthRequest } from '../middleware/auth.js'

const router = express.Router()

// 初始化Z-Pay服务
const zpayService = new ZPayService({
  merchantId: process.env.ZPAY_MERCHANT_ID!,
  secretKey: process.env.ZPAY_SECRET_KEY!,
  apiUrl: process.env.ZPAY_API_URL!,
  webhookSecret: process.env.ZPAY_WEBHOOK_SECRET!
})

// 创建支付订单
router.post('/orders',
  [
    body('planId').notEmpty().withMessage('Plan ID is required'),
    body('paymentMethod').isIn(['zpay', 'alipay', 'wechat']).withMessage('Invalid payment method'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('currency').isIn(['CNY', 'USD']).withMessage('Invalid currency')
  ],
  asyncHandler(async (req: AuthRequest, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw createError('Validation failed', 400)
    }

    const { planId, paymentMethod, amount, currency } = req.body
    const userId = req.user!.id
    const db = await getDB()

    try {
      // 验证会员套餐
      const [planRows] = await db.execute(
        'SELECT * FROM membership_plans WHERE id = ? AND is_active = true',
        [planId]
      )
      const plans = planRows as any[]
      
      if (plans.length === 0) {
        throw createError('Invalid membership plan', 400)
      }

      const plan = plans[0]
      
      // 验证金额
      if (Math.abs(amount - plan.price) > 0.01) {
        throw createError('Amount mismatch', 400)
      }

      // 生成订单ID
      const orderId = ZPayService.generateOrderId(userId)

      // 创建支付订单记录
      await db.execute(`
        INSERT INTO payment_orders (
          id, user_id, plan_id, amount, currency, 
          status, payment_method, payment_provider
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        orderId, userId, planId, amount, currency,
        'pending', paymentMethod, 'zpay'
      ])

      // 根据支付方式处理
      let paymentUrl = ''
      
      if (paymentMethod === 'zpay') {
        const baseUrl = process.env.NODE_ENV === 'production' 
          ? 'https://yourdomain.com' 
          : 'http://localhost:3000'

        const zpayResult = await zpayService.createPaymentOrder({
          orderId,
          amount,
          currency,
          subject: `Translator Agent - ${plan.name}`,
          returnUrl: `${baseUrl}/payment/success`,
          cancelUrl: `${baseUrl}/payment/cancel`,
          notifyUrl: `${process.env.API_BASE_URL || 'http://localhost:3001'}/api/payment/webhook/zpay`
        })

        if (!zpayResult.success) {
          throw createError(zpayResult.message || 'Payment creation failed', 500)
        }

        paymentUrl = zpayResult.paymentUrl!

        // 更新订单记录
        await db.execute(
          'UPDATE payment_orders SET provider_order_id = ? WHERE id = ?',
          [orderId, orderId]
        )
      }

      // 获取完整订单信息
      const [orderRows] = await db.execute(
        'SELECT * FROM payment_orders WHERE id = ?',
        [orderId]
      )
      const orders = orderRows as any[]

      res.json({
        success: true,
        message: 'Payment order created successfully',
        data: {
          ...orders[0],
          paymentUrl
        }
      })

    } catch (error) {
      throw error
    }
  })
)

// 获取订单状态
router.get('/orders/:orderId',
  [
    param('orderId').notEmpty().withMessage('Order ID is required')
  ],
  asyncHandler(async (req: AuthRequest, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw createError('Validation failed', 400)
    }

    const { orderId } = req.params
    const userId = req.user!.id
    const db = await getDB()

    const [rows] = await db.execute(
      'SELECT * FROM payment_orders WHERE id = ? AND user_id = ?',
      [orderId, userId]
    )
    const orders = rows as any[]

    if (orders.length === 0) {
      throw createError('Order not found', 404)
    }

    const order = orders[0]

    // 如果订单状态为pending，查询最新状态
    if (order.status === 'pending' && order.payment_provider === 'zpay') {
      const statusResult = await zpayService.queryOrderStatus(orderId)
      
      if (statusResult.success && statusResult.status !== 'pending') {
        // 更新订单状态
        await db.execute(
          'UPDATE payment_orders SET status = ?, provider_payment_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [statusResult.status, statusResult.paymentId || null, orderId]
        )

        order.status = statusResult.status
        order.provider_payment_id = statusResult.paymentId
      }
    }

    res.json({
      success: true,
      data: order
    })
  })
)

// Z-Pay支付回调
router.post('/webhook/zpay', 
  asyncHandler(async (req, res) => {
    const notification = req.body
    
    // 验证签名
    if (!zpayService.verifyNotification(notification)) {
      console.error('Invalid ZPay notification signature:', notification)
      return res.status(400).json({ success: false, message: 'Invalid signature' })
    }

    const db = await getDB()
    const { order_id, payment_id, status } = notification

    try {
      // 查找订单
      const [orderRows] = await db.execute(
        'SELECT * FROM payment_orders WHERE id = ?',
        [order_id]
      )
      const orders = orderRows as any[]

      if (orders.length === 0) {
        console.error('Order not found for ZPay notification:', order_id)
        return res.status(404).json({ success: false, message: 'Order not found' })
      }

      const order = orders[0]

      // 如果订单已经处理过，直接返回成功
      if (order.status !== 'pending') {
        return res.json({ success: true, message: 'Already processed' })
      }

      // 更新订单状态
      await db.execute(
        'UPDATE payment_orders SET status = ?, provider_payment_id = ?, paid_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, payment_id, status === 'paid' ? new Date() : null, order_id]
      )

      // 如果支付成功，激活会员
      if (status === 'paid') {
        await activateMembership(order.user_id, order.plan_id, db)
      }

      res.json({ success: true, message: 'Notification processed' })

    } catch (error) {
      console.error('ZPay webhook processing error:', error)
      res.status(500).json({ success: false, message: 'Internal server error' })
    }
  })
)

// 验证支付结果
router.post('/verify',
  [
    body('orderId').notEmpty().withMessage('Order ID is required'),
    body('paymentId').notEmpty().withMessage('Payment ID is required')
  ],
  asyncHandler(async (req: AuthRequest, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw createError('Validation failed', 400)
    }

    const { orderId, paymentId } = req.body
    const userId = req.user!.id
    const db = await getDB()

    const [orderRows] = await db.execute(
      'SELECT * FROM payment_orders WHERE id = ? AND user_id = ? AND provider_payment_id = ?',
      [orderId, userId, paymentId]
    )
    const orders = orderRows as any[]

    if (orders.length === 0) {
      throw createError('Payment verification failed', 400)
    }

    const order = orders[0]

    if (order.status !== 'paid') {
      throw createError('Payment not completed', 400)
    }

    // 获取用户会员信息
    const [membershipRows] = await db.execute(`
      SELECT um.*, mp.name, mp.type, mp.features, mp.translation_quota, mp.priority_support
      FROM user_memberships um
      JOIN membership_plans mp ON um.plan_id = mp.id
      WHERE um.user_id = ? AND um.is_active = true
      ORDER BY um.end_date DESC
      LIMIT 1
    `, [userId])

    const memberships = membershipRows as any[]

    res.json({
      success: true,
      data: {
        success: true,
        order,
        membership: memberships.length > 0 ? memberships[0] : null
      }
    })
  })
)

// 激活会员功能
async function activateMembership(userId: string, planId: string, db: any) {
  // 获取套餐信息
  const [planRows] = await db.execute(
    'SELECT * FROM membership_plans WHERE id = ?',
    [planId]
  )
  const plans = planRows as any[]
  
  if (plans.length === 0) {
    throw new Error('Plan not found')
  }

  const plan = plans[0]
  const startDate = new Date()
  const endDate = new Date(startDate.getTime() + plan.duration * 24 * 60 * 60 * 1000)

  // 停用现有会员
  await db.execute(
    'UPDATE user_memberships SET is_active = false WHERE user_id = ? AND is_active = true',
    [userId]
  )

  // 创建新的会员记录
  await db.execute(`
    INSERT INTO user_memberships (
      user_id, plan_id, start_date, end_date, is_active
    ) VALUES (?, ?, ?, ?, true)
  `, [userId, planId, startDate, endDate])
}

export default router