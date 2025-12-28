import apiClient from './axios'
import type { ApiResponse, User } from '@/types'

// 登录
export async function login(credentials: {
  email: string
  password: string
}): Promise<ApiResponse<{ user: User; token: string }>> {
  const response = await apiClient.post<ApiResponse<{ user: User; token: string }>>(
    `/auth/login`,
    credentials
  )
  
  return response.data
}

// 注册
export async function register(userData: {
  username: string
  email: string
  password: string
}): Promise<ApiResponse<User>> {
  const response = await apiClient.post<ApiResponse<User>>(
    `/auth/register`,
    userData
  )
  
  return response.data
}

// 获取用户信息
export async function getUserProfile(): Promise<ApiResponse<User>> {
  const response = await apiClient.get<ApiResponse<User>>(
    `/auth/profile`
  )
  
  return response.data
}

// 更新用户信息
export async function updateUserProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
  const response = await apiClient.put<ApiResponse<User>>(
    `/auth/profile`,
    userData
  )
  
  return response.data
}

// 刷新Token
export async function refreshToken(): Promise<ApiResponse<{ token: string }>> {
  const response = await apiClient.post<ApiResponse<{ token: string }>>(
    `/auth/refresh`
  )
  
  return response.data
}