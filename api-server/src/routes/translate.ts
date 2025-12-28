import express from 'express'
import { body, validationResult } from 'express-validator'
import { getDB } from '../database/connection.js'
import { createTranslationService } from '@translator-agent/core'
import { asyncHandler, createError } from '../middleware/errorHandler.js'
import type { AuthRequest } from '../middleware/auth.js'

const router = express.Router()

// 初始化翻译服务
const translationService = createTranslationService({
  apiKey: process.env.OPENAI_API_KEY!,
  baseURL: process.env.OPENAI_BASE_URL,
  modelName: process.env.MODEL_NAME
})

// 翻译接口
router.post('/',
  [
    body('content').notEmpty().withMessage('Content is required'),
    body('type').isIn(['text', 'file', 'url']).withMessage('Invalid content type'),
    body('sourceLang').notEmpty().withMessage('Source language is required'),
    body('targetLang').notEmpty().withMessage('Target language is required')
  ],
  asyncHandler(async (req: AuthRequest, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw createError('Validation failed', 400)
    }

    const { content, type, sourceLang, targetLang } = req.body
    const userId = req.user!.id
    const db = await getDB()

    try {
      // 检查用户翻译额度
      const quotaCheck = await checkTranslationQuota(userId, content.length, db)
      if (!quotaCheck.allowed) {
        return res.status(429).json({
          success: false,
          message: quotaCheck.message || 'Translation quota exceeded',
          error: 'QUOTA_EXCEEDED'
        })
      }

      // 执行翻译
      const translationRequest = {
        content,
        type,
        sourceLang,
        targetLang,
        userId
      }

      const result = await translationService.translate(translationRequest)

      if (result.success) {
        // 保存翻译记录
        await saveTranslationRecord({
          userId,
          sourceText: result.originalText,
          targetText: result.translatedText!,
          sourceLang,
          targetLang,
          type,
          characterCount: result.characterCount,
          status: 'completed'
        }, db)

        // 更新用户使用统计
        await updateUsageStats(userId, result.characterCount, db)

        res.json({
          success: true,
          data: {
            translatedText: result.translatedText,
            usage: {
              charactersUsed: result.characterCount,
              remainingQuota: quotaCheck.remainingQuota! - result.characterCount
            }
          }
        })
      } else {
        // 保存失败的翻译记录
        await saveTranslationRecord({
          userId,
          sourceText: result.originalText,
          targetText: null,
          sourceLang,
          targetLang,
          type,
          characterCount: result.characterCount,
          status: 'failed',
          errorMessage: result.error
        }, db)

        res.status(500).json({
          success: false,
          message: result.error || 'Translation failed'
        })
      }

    } catch (error: any) {
      console.error('Translation error:', error)
      res.status(500).json({
        success: false,
        message: error.message || 'Translation service error'
      })
    }
  })
)

// 获取翻译历史
router.get('/history',
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const offset = (page - 1) * limit

    const db = await getDB()

    // 获取翻译记录
    const [rows] = await db.execute(`
      SELECT id, source_text, target_text, source_lang, target_lang, 
             type, character_count, status, created_at
      FROM translation_requests 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `, [userId, limit, offset])

    // 获取总数
    const [countRows] = await db.execute(
      'SELECT COUNT(*) as total FROM translation_requests WHERE user_id = ?',
      [userId]
    )

    const total = (countRows as any[])[0].total

    res.json({
      success: true,
      data: {
        records: rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })
  })
)

// 获取翻译统计
router.get('/stats',
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id
    const db = await getDB()

    // 获取总翻译次数
    const [totalRows] = await db.execute(
      'SELECT COUNT(*) as total FROM translation_requests WHERE user_id = ? AND status = "completed"',
      [userId]
    )

    // 获取本月使用情况
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
    const [monthlyRows] = await db.execute(
      'SELECT characters_used, translations_count FROM user_usage_stats WHERE user_id = ? AND month = ?',
      [userId, currentMonth]
    )

    const monthlyStats = (monthlyRows as any[])[0] || { characters_used: 0, translations_count: 0 }

    // 获取用户会员信息以计算剩余额度
    const [membershipRows] = await db.execute(`
      SELECT mp.translation_quota
      FROM user_memberships um
      JOIN membership_plans mp ON um.plan_id = mp.id
      WHERE um.user_id = ? AND um.is_active = true AND um.end_date > NOW()
      ORDER BY um.end_date DESC
      LIMIT 1
    `, [userId])

    const memberships = membershipRows as any[]
    const quota = memberships.length > 0 ? memberships[0].translation_quota : 1000 // 默认免费额度
    const remainingQuota = quota === -1 ? -1 : Math.max(0, quota - monthlyStats.characters_used)

    res.json({
      success: true,
      data: {
        totalTranslations: (totalRows as any[])[0].total,
        charactersUsed: monthlyStats.characters_used,
        remainingQuota,
        monthlyUsage: monthlyStats.translations_count
      }
    })
  })
)

// 语言检测
router.post('/detect-language',
  [
    body('text').notEmpty().withMessage('Text is required')
  ],
  asyncHandler(async (req: AuthRequest, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw createError('Validation failed', 400)
    }

    const { text } = req.body

    try {
      const detectedLang = await translationService.detectLanguage(text)
      
      res.json({
        success: true,
        data: {
          detectedLanguage: detectedLang
        }
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Language detection failed'
      })
    }
  })
)

// 检查翻译额度
async function checkTranslationQuota(userId: string, characterCount: number, db: any): Promise<{
  allowed: boolean
  message?: string
  remainingQuota?: number
}> {
  // 获取用户会员信息
  const [membershipRows] = await db.execute(`
    SELECT mp.translation_quota
    FROM user_memberships um
    JOIN membership_plans mp ON um.plan_id = mp.id
    WHERE um.user_id = ? AND um.is_active = true AND um.end_date > NOW()
    ORDER BY um.end_date DESC
    LIMIT 1
  `, [userId])

  const memberships = membershipRows as any[]
  const quota = memberships.length > 0 ? memberships[0].translation_quota : 1000 // 默认免费额度

  // 无限额度
  if (quota === -1) {
    return { allowed: true, remainingQuota: -1 }
  }

  // 获取本月使用情况
  const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
  const [usageRows] = await db.execute(
    'SELECT characters_used FROM user_usage_stats WHERE user_id = ? AND month = ?',
    [userId, currentMonth]
  )

  const usageStats = (usageRows as any[])[0] || { characters_used: 0 }
  const remainingQuota = quota - usageStats.characters_used

  if (remainingQuota < characterCount) {
    return {
      allowed: false,
      message: `翻译额度不足。当前剩余: ${remainingQuota} 字符，需要: ${characterCount} 字符`,
      remainingQuota
    }
  }

  return { allowed: true, remainingQuota }
}

// 保存翻译记录
async function saveTranslationRecord(record: {
  userId: string
  sourceText: string
  targetText: string | null
  sourceLang: string
  targetLang: string
  type: string
  characterCount: number
  status: string
  errorMessage?: string
}, db: any) {
  await db.execute(`
    INSERT INTO translation_requests (
      user_id, source_text, target_text, source_lang, target_lang,
      type, character_count, status, error_message
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    record.userId, record.sourceText, record.targetText, record.sourceLang,
    record.targetLang, record.type, record.characterCount, record.status,
    record.errorMessage || null
  ])
}

// 更新使用统计
async function updateUsageStats(userId: string, characterCount: number, db: any) {
  const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM

  await db.execute(`
    INSERT INTO user_usage_stats (user_id, month, characters_used, translations_count)
    VALUES (?, ?, ?, 1)
    ON DUPLICATE KEY UPDATE
    characters_used = characters_used + ?,
    translations_count = translations_count + 1,
    updated_at = CURRENT_TIMESTAMP
  `, [userId, currentMonth, characterCount, characterCount])
}

export default router