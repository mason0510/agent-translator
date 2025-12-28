import apiClient from './axios'
import type { ApiResponse, PaymentOrder } from '@/types'

// 创建支付订单
export async function createPaymentOrder(orderData: {
  planId: string
  paymentMethod: string
  amount: number
  currency: string
}): Promise<PaymentOrder> {
  const response = await apiClient.post<ApiResponse<PaymentOrder>>(
    `/payment/orders`,
    orderData
  )
  
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || '创建订单失败')
  }
  
  return response.data.data
}

// Z-Pay支付处理
export async function processZPayPayment(paymentData: {
  orderId: string
  amount: number
  currency: string
  returnUrl: string
  cancelUrl: string
}): Promise<{ paymentUrl: string }> {
  const response = await apiClient.post<ApiResponse<{ paymentUrl: string }>>(
    `/payment/zpay/process`,
    paymentData
  )
  
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Z-Pay支付处理失败')
  }
  
  return response.data.data
}

// 验证支付结果
export async function verifyPayment(orderId: string, paymentId: string): Promise<{
  success: boolean
  order: PaymentOrder
  membership?: any
}> {
  const response = await apiClient.post<ApiResponse<{
    success: boolean
    order: PaymentOrder
    membership?: any
  }>>(`/payment/verify`, {
    orderId,
    paymentId
  })
  
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || '支付验证失败')
  }
  
  return response.data.data
}

// 获取支付订单状态
export async function getPaymentOrderStatus(orderId: string): Promise<PaymentOrder> {
  const response = await apiClient.get<ApiResponse<PaymentOrder>>(
    `/payment/orders/${orderId}`
  )
  
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || '获取订单状态失败')
  }
  
  return response.data.data
}