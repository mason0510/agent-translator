import crypto from 'crypto'
import axios from 'axios'

export interface ZPayConfig {
  merchantId: string
  secretKey: string
  apiUrl: string
  webhookSecret: string
}

export interface ZPayOrderRequest {
  orderId: string
  amount: number
  currency: string
  subject: string
  returnUrl: string
  cancelUrl: string
  notifyUrl: string
}

export interface ZPayOrderResponse {
  success: boolean
  paymentUrl?: string
  orderId: string
  message?: string
}

export interface ZPayNotification {
  order_id: string
  payment_id: string
  amount: string
  currency: string
  status: 'paid' | 'failed' | 'cancelled'
  timestamp: string
  signature: string
}

export class ZPayService {
  private config: ZPayConfig

  constructor(config: ZPayConfig) {
    this.config = config
  }

  // 创建支付订单
  async createPaymentOrder(orderRequest: ZPayOrderRequest): Promise<ZPayOrderResponse> {
    try {
      const params = {
        merchant_id: this.config.merchantId,
        order_id: orderRequest.orderId,
        amount: orderRequest.amount.toFixed(2),
        currency: orderRequest.currency,
        subject: orderRequest.subject,
        return_url: orderRequest.returnUrl,
        cancel_url: orderRequest.cancelUrl,
        notify_url: orderRequest.notifyUrl,
        timestamp: Math.floor(Date.now() / 1000).toString()
      }

      // 生成签名
      const signature = this.generateSignature(params)
      params['signature'] = signature

      const response = await axios.post(`${this.config.apiUrl}/create_order`, params, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'TranslatorAgent/1.0'
        },
        timeout: 30000
      })

      if (response.data.success) {
        return {
          success: true,
          paymentUrl: response.data.payment_url,
          orderId: orderRequest.orderId
        }
      } else {
        return {
          success: false,
          orderId: orderRequest.orderId,
          message: response.data.message || 'Payment order creation failed'
        }
      }

    } catch (error: any) {
      console.error('ZPay order creation error:', error)
      return {
        success: false,
        orderId: orderRequest.orderId,
        message: error.response?.data?.message || error.message || 'Network error'
      }
    }
  }

  // 查询订单状态
  async queryOrderStatus(orderId: string): Promise<{
    success: boolean
    status?: 'pending' | 'paid' | 'failed' | 'cancelled'
    paymentId?: string
    message?: string
  }> {
    try {
      const params = {
        merchant_id: this.config.merchantId,
        order_id: orderId,
        timestamp: Math.floor(Date.now() / 1000).toString()
      }

      const signature = this.generateSignature(params)
      params['signature'] = signature

      const response = await axios.get(`${this.config.apiUrl}/query_order`, {
        params,
        timeout: 30000
      })

      if (response.data.success) {
        return {
          success: true,
          status: response.data.status,
          paymentId: response.data.payment_id
        }
      } else {
        return {
          success: false,
          message: response.data.message || 'Order query failed'
        }
      }

    } catch (error: any) {
      console.error('ZPay order query error:', error)
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Network error'
      }
    }
  }

  // 验证回调通知
  verifyNotification(notification: ZPayNotification): boolean {
    try {
      const params = {
        order_id: notification.order_id,
        payment_id: notification.payment_id,
        amount: notification.amount,
        currency: notification.currency,
        status: notification.status,
        timestamp: notification.timestamp
      }

      const expectedSignature = this.generateSignature(params)
      return expectedSignature === notification.signature

    } catch (error) {
      console.error('ZPay notification verification error:', error)
      return false
    }
  }

  // 生成签名
  private generateSignature(params: Record<string, string>): string {
    // 按key排序
    const sortedKeys = Object.keys(params).sort()
    
    // 构建签名字符串
    const signString = sortedKeys
      .map(key => `${key}=${params[key]}`)
      .join('&') + `&key=${this.config.secretKey}`

    // 生成MD5签名
    return crypto
      .createHash('md5')
      .update(signString, 'utf8')
      .digest('hex')
      .toUpperCase()
  }

  // 生成订单号
  static generateOrderId(userId: string): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `TA${userId.substring(0, 8)}${timestamp}${random}`.toUpperCase()
  }
}