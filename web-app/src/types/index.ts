export interface User {
  id: string
  email: string
  username: string
  avatar?: string
  membership?: MembershipPlan
  createdAt: string
  updatedAt: string
}

export interface MembershipPlan {
  id: string
  name: string
  type: 'basic' | 'premium' | 'enterprise'
  price: number
  duration: number // in days
  features: string[]
  isActive: boolean
  expiryDate?: string
  translationQuota: number
  prioritySupport: boolean
}

export interface PaymentOrder {
  id: string
  userId: string
  planId: string
  amount: number
  currency: string
  status: 'pending' | 'paid' | 'failed' | 'cancelled'
  paymentMethod: string
  paymentUrl?: string
  createdAt: string
  updatedAt: string
}

export interface TranslationRequest {
  id: string
  userId?: string
  sourceText: string
  targetText: string
  sourceLang: string
  targetLang: string
  type: 'text' | 'file' | 'url'
  status: 'pending' | 'completed' | 'failed'
  createdAt: string
}

export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  error?: string
}

export interface PlanFeature {
  name: string
  description: string
  included: boolean
}