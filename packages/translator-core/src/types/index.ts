export interface TranslationRequest {
  content: string
  type: 'text' | 'file' | 'url'
  sourceLang: string
  targetLang: string
  userId?: string
}

export interface TranslationResponse {
  success: boolean
  translatedText?: string
  originalText: string
  sourceLang: string
  targetLang: string
  characterCount: number
  error?: string
  usage?: {
    charactersUsed: number
    remainingQuota?: number
  }
}

export interface TranslationConfig {
  apiKey: string
  baseURL?: string
  modelName?: string
  maxRetries?: number
  timeout?: number
}

export interface FileContent {
  name: string
  content: string
  type: string
  size: number
}

export interface UrlContent {
  url: string
  title?: string
  content: string
  markdown: string
}

export interface ToolCallResult {
  type: 'file_read' | 'url_fetched' | 'error'
  data: any
}

export interface ToolContext {
  abortController: AbortController
  options: {
    isNonInteractiveSession: boolean
  }
}