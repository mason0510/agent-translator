import { FileReaderTool } from '../tools/file-reader.js'
import { UrlFetcherTool } from '../tools/url-fetcher.js'
import type { 
  TranslationRequest, 
  FileContent, 
  UrlContent 
} from '../types/index.js'

export class ContentProcessor {
  private fileReader: FileReaderTool
  private urlFetcher: UrlFetcherTool

  constructor() {
    this.fileReader = new FileReaderTool()
    this.urlFetcher = new UrlFetcherTool()
  }

  async processContent(request: TranslationRequest): Promise<{
    content: string
    metadata?: FileContent | UrlContent
  }> {
    const { content, type } = request

    switch (type) {
      case 'text':
        return { content }

      case 'file':
        try {
          const fileContent = await this.fileReader.readFileContent(content)
          return {
            content: fileContent.content,
            metadata: fileContent
          }
        } catch (error) {
          throw new Error(`文件读取失败: ${error instanceof Error ? error.message : '未知错误'}`)
        }

      case 'url':
        try {
          const urlContent = await this.urlFetcher.fetchUrlContent(content)
          return {
            content: urlContent.markdown,
            metadata: urlContent
          }
        } catch (error) {
          throw new Error(`网页获取失败: ${error instanceof Error ? error.message : '未知错误'}`)
        }

      default:
        throw new Error(`不支持的内容类型: ${type}`)
    }
  }

  async validateContent(request: TranslationRequest): Promise<{
    isValid: boolean
    error?: string
    contentLength?: number
  }> {
    const { content, type } = request

    if (!content || content.trim().length === 0) {
      return {
        isValid: false,
        error: '内容不能为空'
      }
    }

    try {
      switch (type) {
        case 'text':
          return {
            isValid: true,
            contentLength: content.length
          }

        case 'file':
          // 验证文件路径格式
          if (!content.includes('/') && !content.includes('\\')) {
            return {
              isValid: false,
              error: '请提供完整的文件路径'
            }
          }
          
          try {
            const fileContent = await this.fileReader.readFileContent(content)
            return {
              isValid: true,
              contentLength: fileContent.content.length
            }
          } catch (error) {
            return {
              isValid: false,
              error: `文件无法读取: ${error instanceof Error ? error.message : '未知错误'}`
            }
          }

        case 'url':
          // 验证URL格式
          try {
            new URL(content)
          } catch {
            return {
              isValid: false,
              error: '请提供有效的URL地址'
            }
          }

          if (!content.startsWith('http://') && !content.startsWith('https://')) {
            return {
              isValid: false,
              error: 'URL必须以http://或https://开头'
            }
          }

          return {
            isValid: true,
            contentLength: 0 // URL长度不能预先确定
          }

        default:
          return {
            isValid: false,
            error: `不支持的内容类型: ${type}`
          }
      }
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : '验证过程中发生未知错误'
      }
    }
  }

  getContentTypeDescription(type: string): string {
    const descriptions: Record<string, string> = {
      'text': '文本内容',
      'file': '本地文件',
      'url': '网页内容'
    }
    return descriptions[type] || '未知类型'
  }

  getMaxContentLength(type: string): number {
    const limits: Record<string, number> = {
      'text': 10000,   // 10K characters for text
      'file': 50000,   // 50K characters for files
      'url': 100000    // 100K characters for web pages
    }
    return limits[type] || 10000
  }
}