import { createOpenAI } from "@ai-sdk/openai"
import { generateText, LanguageModel } from "ai"
import type { 
  TranslationRequest, 
  TranslationResponse, 
  TranslationConfig 
} from "../types/index.js"

export class TranslatorService {
  private openai: any
  private config: TranslationConfig

  constructor(config: TranslationConfig) {
    this.config = config
    this.openai = createOpenAI({
      baseURL: config.baseURL,
      apiKey: config.apiKey,
    })
  }

  private getLanguageModel(): LanguageModel {
    const model = this.config.modelName || "doubao-seed-1-6-250615"
    console.log(`[Translator Service] Using model: ${model}`)
    return this.openai(model)
  }

  private getLanguageName(code: string): string {
    const languages: Record<string, string> = {
      'zh': '中文',
      'en': '英文', 
      'ja': '日文',
      'ko': '韩文',
      'fr': '法文',
      'de': '德文',
      'es': '西班牙文',
      'ru': '俄文',
      'it': '意大利文',
      'pt': '葡萄牙文',
      'ar': '阿拉伯文',
      'hi': '印地文',
      'th': '泰文',
      'vi': '越南文',
      'auto': '自动检测'
    }
    return languages[code] || code
  }

  private generateSystemPrompt(sourceLang: string, targetLang: string): string {
    const sourceName = this.getLanguageName(sourceLang)
    const targetName = this.getLanguageName(targetLang)
    
    return `你是一个专业的翻译助手。请将用户提供的内容从${sourceName}翻译成${targetName}。

翻译要求：
1. 保持原文的意思和语调
2. 使用自然、流畅的表达
3. 保留原文的格式和结构
4. 对于专业术语，提供准确的翻译
5. 如果是代码或技术文档，保持专业性
6. 如果遇到无法翻译的内容，请保持原文

请直接输出翻译结果，不要添加任何解释或说明。`
  }

  async translate(request: TranslationRequest): Promise<TranslationResponse> {
    try {
      const { content, sourceLang, targetLang } = request
      
      if (!content || content.trim().length === 0) {
        return {
          success: false,
          error: '翻译内容不能为空',
          originalText: content,
          sourceLang,
          targetLang,
          characterCount: 0
        }
      }

      // 如果源语言和目标语言相同，直接返回原文
      if (sourceLang === targetLang && sourceLang !== 'auto') {
        return {
          success: true,
          translatedText: content,
          originalText: content,
          sourceLang,
          targetLang,
          characterCount: content.length
        }
      }

      const systemPrompt = this.generateSystemPrompt(sourceLang, targetLang)
      
      const result = await generateText({
        model: this.getLanguageModel(),
        system: systemPrompt,
        prompt: content,
        temperature: 0.1,
        maxTokens: Math.min(4000, content.length * 2)
      })

      if (!result.text) {
        throw new Error('翻译服务返回空结果')
      }

      return {
        success: true,
        translatedText: result.text.trim(),
        originalText: content,
        sourceLang,
        targetLang,
        characterCount: content.length,
        usage: {
          charactersUsed: content.length
        }
      }

    } catch (error: any) {
      console.error('Translation error:', error)
      
      return {
        success: false,
        error: error.message || '翻译过程中发生未知错误',
        originalText: request.content,
        sourceLang: request.sourceLang,
        targetLang: request.targetLang,
        characterCount: request.content.length
      }
    }
  }

  async batchTranslate(
    requests: TranslationRequest[]
  ): Promise<TranslationResponse[]> {
    const results: TranslationResponse[] = []
    
    for (const request of requests) {
      const result = await this.translate(request)
      results.push(result)
      
      // 添加小延迟以避免API限制
      if (requests.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    
    return results
  }

  async detectLanguage(text: string): Promise<string> {
    try {
      const result = await generateText({
        model: this.getLanguageModel(),
        system: `你是一个语言检测助手。请检测用户输入文本的语言，只返回语言代码。

支持的语言代码：
- zh: 中文
- en: 英文
- ja: 日文
- ko: 韩文
- fr: 法文
- de: 德文
- es: 西班牙文
- ru: 俄文
- it: 意大利文
- pt: 葡萄牙文

请只返回语言代码，不要添加任何其他内容。`,
        prompt: text.substring(0, 200), // 只取前200字符进行语言检测
        temperature: 0,
        maxTokens: 10
      })

      const detectedLang = result.text.trim().toLowerCase()
      
      // 验证返回的语言代码是否有效
      const validLangs = ['zh', 'en', 'ja', 'ko', 'fr', 'de', 'es', 'ru', 'it', 'pt']
      if (validLangs.includes(detectedLang)) {
        return detectedLang
      }
      
      return 'auto' // 如果检测失败，返回auto
    } catch (error) {
      console.error('Language detection error:', error)
      return 'auto'
    }
  }
}