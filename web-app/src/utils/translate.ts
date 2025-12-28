import apiClient from './axios'
import type { ApiResponse, TranslationRequest } from '@/types'

// 翻译内容
export async function translateContent(request: {
  content: string
  type: 'text' | 'file' | 'url'
  sourceLang: string
  targetLang: string
}): Promise<{
  success: boolean
  translatedText?: string
  error?: string
}> {
  try {
    const response = await apiClient.post<ApiResponse<{
      translatedText: string
      usage: {
        charactersUsed: number
        remainingQuota: number
      }
    }>>(`/translate`, request)
    
    if (response.data.success && response.data.data) {
      return {
        success: true,
        translatedText: response.data.data.translatedText
      }
    } else {
      return {
        success: false,
        error: response.data.message || '翻译失败'
      }
    }
  } catch (error: any) {
    if (error.response?.status === 429) {
      return {
        success: false,
        error: 'QUOTA_EXCEEDED'
      }
    }
    
    return {
      success: false,
      error: error.response?.data?.message || '翻译服务暂时不可用'
    }
  }
}

// 获取翻译历史
export async function getTranslationHistory(): Promise<ApiResponse<TranslationRequest[]>> {
  const response = await apiClient.get<ApiResponse<TranslationRequest[]>>(
    `/translate/history`
  )
  
  return response.data
}

// 获取用户翻译统计
export async function getTranslationStats(): Promise<ApiResponse<{
  totalTranslations: number
  charactersUsed: number
  remainingQuota: number
  monthlyUsage: number
}>> {
  const response = await apiClient.get<ApiResponse<{
    totalTranslations: number
    charactersUsed: number
    remainingQuota: number
    monthlyUsage: number
  }>>(`/translate/stats`)
  
  return response.data
}