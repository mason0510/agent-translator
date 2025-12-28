<template>
  <div class="home-view">
    <div class="page-container">
      <!-- Hero Section -->
      <div class="hero-section">
        <h1 class="hero-title">AI智能翻译助手</h1>
        <p class="hero-subtitle">
          支持文本、文件、网页翻译，让语言不再是障碍
        </p>
        <div class="hero-actions">
          <el-button type="primary" size="large" @click="$router.push('/translate')">
            开始翻译
          </el-button>
          <el-button size="large" @click="$router.push('/membership')">
            查看会员套餐
          </el-button>
        </div>
      </div>

      <!-- Features Section -->
      <div class="features-section">
        <h2 class="section-title">产品特性</h2>
        <el-row :gutter="30">
          <el-col :span="8">
            <el-card class="feature-card" shadow="hover">
              <div class="feature-icon">
                <el-icon size="40" color="#409eff"><Document /></el-icon>
              </div>
              <h3>多种翻译方式</h3>
              <p>支持文本、文件、网页等多种内容的翻译，满足不同场景需求</p>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card class="feature-card" shadow="hover">
              <div class="feature-icon">
                <el-icon size="40" color="#67c23a"><ChatDotRound /></el-icon>
              </div>
              <h3>AI智能翻译</h3>
              <p>基于先进的AI技术，提供准确、自然的翻译结果</p>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card class="feature-card" shadow="hover">
              <div class="feature-icon">
                <el-icon size="40" color="#e6a23c"><Star /></el-icon>
              </div>
              <h3>多语言支持</h3>
              <p>支持100+种语言翻译，覆盖全球主要语言</p>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- Pricing Section -->
      <div class="pricing-section">
        <h2 class="section-title">会员套餐</h2>
        <p class="section-subtitle">选择适合您的翻译套餐</p>
        <div class="pricing-preview">
          <el-row :gutter="20" justify="center">
            <el-col :span="6" v-for="plan in previewPlans" :key="plan.id">
              <el-card class="pricing-card" shadow="hover">
                <div class="pricing-header">
                  <h3>{{ plan.name }}</h3>
                  <div class="price">¥{{ plan.price }}/月</div>
                </div>
                <ul class="pricing-features">
                  <li v-for="feature in plan.features.slice(0, 3)" :key="feature">
                    {{ feature }}
                  </li>
                </ul>
                <el-button type="primary" @click="$router.push('/membership')" block>
                  了解详情
                </el-button>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Document, ChatDotRound, Star } from '@element-plus/icons-vue'

const previewPlans = [
  {
    id: 'basic',
    name: '基础版',
    price: 29,
    features: [
      '每月10,000字翻译额度',
      '支持文本翻译',
      '基础客服支持'
    ]
  },
  {
    id: 'premium',
    name: '专业版',
    price: 99,
    features: [
      '每月50,000字翻译额度',
      '支持文本、文件、网页翻译',
      '优先客服支持'
    ]
  },
  {
    id: 'enterprise',
    name: '企业版',
    price: 299,
    features: [
      '无限翻译额度',
      '支持所有翻译类型',
      '专属客服支持'
    ]
  }
]
</script>

<style scoped>
.home-view {
  padding: 0;
}

.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
  padding: 100px 0;
}

.hero-title {
  font-size: 48px;
  margin-bottom: 20px;
  font-weight: bold;
}

.hero-subtitle {
  font-size: 20px;
  margin-bottom: 40px;
  opacity: 0.9;
}

.hero-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.features-section {
  padding: 80px 0;
  background: white;
}

.section-title {
  text-align: center;
  font-size: 36px;
  margin-bottom: 20px;
  color: #333;
}

.section-subtitle {
  text-align: center;
  font-size: 18px;
  color: #666;
  margin-bottom: 50px;
}

.feature-card {
  text-align: center;
  padding: 30px 20px;
  height: 280px;
}

.feature-icon {
  margin-bottom: 20px;
}

.feature-card h3 {
  font-size: 24px;
  margin-bottom: 15px;
  color: #333;
}

.feature-card p {
  color: #666;
  line-height: 1.6;
}

.pricing-section {
  padding: 80px 0;
  background: #f8f9fa;
}

.pricing-preview {
  max-width: 900px;
  margin: 0 auto;
}

.pricing-card {
  text-align: center;
  padding: 30px 20px;
}

.pricing-header h3 {
  font-size: 24px;
  margin-bottom: 10px;
  color: #333;
}

.price {
  font-size: 32px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 20px;
}

.pricing-features {
  list-style: none;
  padding: 0;
  margin: 0 0 30px 0;
}

.pricing-features li {
  padding: 8px 0;
  color: #666;
}
</style>