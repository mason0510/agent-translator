// Main exports
export { TranslatorService } from './services/translator.js'
export { ContentProcessor } from './services/content-processor.js'

// Tool exports
export { FileReaderTool, UrlFetcherTool } from './tools/index.js'

// Type exports
export type {
  TranslationRequest,
  TranslationResponse,
  TranslationConfig,
  FileContent,
  UrlContent,
  ToolCallResult,
  ToolContext
} from './types/index.js'

// Import for function
import { TranslatorService } from './services/translator.js'
import { ContentProcessor } from './services/content-processor.js'
import type { TranslationRequest } from './types/index.js'

// Utility function to create a complete translation service
export function createTranslationService(config: {
  apiKey: string
  baseURL?: string
  modelName?: string
}) {
  const translator = new TranslatorService(config)
  const processor = new ContentProcessor()

  return {
    async translate(request: TranslationRequest) {
      // 验证内容
      const validation = await processor.validateContent(request)
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
          originalText: request.content,
          sourceLang: request.sourceLang,
          targetLang: request.targetLang,
          characterCount: 0
        }
      }

      // 处理内容
      const { content, metadata } = await processor.processContent(request)
      
      // 执行翻译
      const translationRequest = {
        ...request,
        content
      }

      const result = await translator.translate(translationRequest)
      
      // 添加元数据信息
      if (metadata && result.success) {
        return {
          ...result,
          metadata
        }
      }

      return result
    },

    async batchTranslate(requests: TranslationRequest[]) {
      return translator.batchTranslate(requests)
    },

    async detectLanguage(text: string) {
      return translator.detectLanguage(text)
    },

    processor,
    translator
  }
}