<template>
  <div class="translate-view">
    <div class="page-container">
      <div class="translate-container">
        <h1 class="translate-title">{{ $t('translate.title') }}</h1>
        
        <el-card class="translate-card">
          <!-- 语言选择 -->
          <div class="language-selector">
            <el-select v-model="sourceLang" placeholder="源语言" style="width: 150px">
              <el-option label="自动检测" value="auto" />
              <el-option label="中文" value="zh" />
              <el-option label="英文" value="en" />
              <el-option label="日文" value="ja" />
              <el-option label="韩文" value="ko" />
              <el-option label="法文" value="fr" />
              <el-option label="德文" value="de" />
              <el-option label="西班牙文" value="es" />
            </el-select>
            
            <el-button @click="swapLanguages" :icon="Switch" circle />
            
            <el-select v-model="targetLang" placeholder="目标语言" style="width: 150px">
              <el-option label="中文" value="zh" />
              <el-option label="英文" value="en" />
              <el-option label="日文" value="ja" />
              <el-option label="韩文" value="ko" />
              <el-option label="法文" value="fr" />
              <el-option label="德文" value="de" />
              <el-option label="西班牙文" value="es" />
            </el-select>
          </div>

          <!-- 翻译输入区域 -->
          <div class="translate-content">
            <el-row :gutter="20">
              <el-col :span="12">
                <div class="input-section">
                  <div class="section-header">
                    <span>{{ $t('translate.input') }}</span>
                    <el-button text @click="clearInput">
                      {{ $t('translate.clear') }}
                    </el-button>
                  </div>
                  
                  <!-- 输入类型选择 -->
                  <el-radio-group v-model="inputType" class="input-type-selector">
                    <el-radio-button label="text">文本</el-radio-button>
                    <el-radio-button label="file">文件</el-radio-button>
                    <el-radio-button label="url">网址</el-radio-button>
                  </el-radio-group>

                  <!-- 文本输入 -->
                  <div v-if="inputType === 'text'" class="input-area">
                    <el-input
                      v-model="inputText"
                      type="textarea"
                      :rows="8"
                      :placeholder="$t('translate.input')"
                      show-word-limit
                      maxlength="5000"
                    />
                  </div>

                  <!-- 文件上传 -->
                  <div v-else-if="inputType === 'file'" class="input-area">
                    <el-upload
                      ref="uploadRef"
                      :auto-upload="false"
                      :on-change="handleFileChange"
                      accept=".txt,.md,.html,.docx"
                      drag
                    >
                      <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                      <div class="el-upload__text">
                        将文件拖到此处，或<em>点击上传</em>
                      </div>
                      <template #tip>
                        <div class="el-upload__tip">
                          支持 .txt, .md, .html, .docx 格式文件
                        </div>
                      </template>
                    </el-upload>
                  </div>

                  <!-- URL输入 -->
                  <div v-else-if="inputType === 'url'" class="input-area">
                    <el-input
                      v-model="inputUrl"
                      placeholder="请输入网页URL"
                      prefix-icon="Link"
                    />
                  </div>
                </div>
              </el-col>

              <el-col :span="12">
                <div class="output-section">
                  <div class="section-header">
                    <span>{{ $t('translate.output') }}</span>
                    <el-button text @click="copyResult" :disabled="!translationResult">
                      {{ $t('translate.copy') }}
                    </el-button>
                  </div>
                  
                  <div class="output-area">
                    <el-input
                      v-model="translationResult"
                      type="textarea"
                      :rows="8"
                      readonly
                      placeholder="翻译结果将显示在这里..."
                    />
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>

          <!-- 翻译按钮 -->
          <div class="translate-actions">
            <el-button 
              type="primary" 
              size="large" 
              @click="performTranslation"
              :loading="translating"
              :disabled="!canTranslate"
            >
              {{ translating ? '翻译中...' : $t('translate.translate') }}
            </el-button>
          </div>
        </el-card>

        <!-- 会员限制提示 -->
        <el-alert
          v-if="showMembershipAlert"
          title="翻译额度不足"
          type="warning"
          show-icon
          class="membership-alert"
        >
          <template #default>
            <p>您的翻译额度已用完，请升级会员以继续使用翻译服务。</p>
            <el-button type="primary" size="small" @click="$router.push('/membership')">
              升级会员
            </el-button>
          </template>
        </el-alert>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { Switch, UploadFilled } from '@element-plus/icons-vue'
import { translateContent } from '@/utils/translate'

const userStore = useUserStore()

const sourceLang = ref('auto')
const targetLang = ref('zh')
const inputType = ref('text')
const inputText = ref('')
const inputUrl = ref('')
const selectedFile = ref<File | null>(null)
const translationResult = ref('')
const translating = ref(false)

const showMembershipAlert = ref(false)

const canTranslate = computed(() => {
  switch (inputType.value) {
    case 'text':
      return inputText.value.trim().length > 0
    case 'file':
      return selectedFile.value !== null
    case 'url':
      return inputUrl.value.trim().length > 0
    default:
      return false
  }
})

const swapLanguages = () => {
  if (sourceLang.value !== 'auto') {
    const temp = sourceLang.value
    sourceLang.value = targetLang.value
    targetLang.value = temp
  }
}

const clearInput = () => {
  inputText.value = ''
  inputUrl.value = ''
  selectedFile.value = null
  translationResult.value = ''
}

const handleFileChange = (file: any) => {
  selectedFile.value = file.raw
}

const copyResult = async () => {
  if (translationResult.value) {
    try {
      await navigator.clipboard.writeText(translationResult.value)
      ElMessage.success('已复制到剪贴板')
    } catch (error) {
      ElMessage.error('复制失败')
    }
  }
}

const performTranslation = async () => {
  if (!canTranslate.value) return

  try {
    translating.value = true
    
    let contentToTranslate = ''
    let contentType = inputType.value

    // 根据输入类型获取内容
    switch (inputType.value) {
      case 'text':
        contentToTranslate = inputText.value.trim()
        break
      case 'file':
        if (selectedFile.value) {
          // 这里需要读取文件内容
          contentToTranslate = await readFileContent(selectedFile.value)
        }
        break
      case 'url':
        contentToTranslate = inputUrl.value.trim()
        break
    }

    // 调用翻译API
    const result = await translateContent({
      content: contentToTranslate,
      type: contentType as 'text' | 'file' | 'url',
      sourceLang: sourceLang.value,
      targetLang: targetLang.value
    })

    if (result.success) {
      translationResult.value = result.translatedText
      ElMessage.success('翻译完成')
    } else {
      if (result.error === 'QUOTA_EXCEEDED') {
        showMembershipAlert.value = true
        ElMessage.warning('翻译额度不足，请升级会员')
      } else {
        ElMessage.error(result.error || '翻译失败')
      }
    }

  } catch (error) {
    ElMessage.error('翻译过程中发生错误')
  } finally {
    translating.value = false
  }
}

const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      resolve(e.target?.result as string)
    }
    reader.onerror = reject
    reader.readAsText(file)
  })
}
</script>

<style scoped>
.translate-view {
  padding: 20px 0;
  min-height: calc(100vh - 200px);
}

.translate-container {
  max-width: 1200px;
  margin: 0 auto;
}

.translate-title {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.translate-card {
  padding: 30px;
}

.language-selector {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
}

.translate-content {
  margin-bottom: 30px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  font-weight: bold;
  color: #333;
}

.input-type-selector {
  margin-bottom: 15px;
}

.input-area,
.output-area {
  min-height: 200px;
}

.translate-actions {
  text-align: center;
}

.membership-alert {
  margin-top: 20px;
}

.el-upload {
  width: 100%;
}
</style>