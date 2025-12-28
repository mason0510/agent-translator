<template>
  <div class="membership-view">
    <div class="page-container">
      <el-card class="current-membership" v-if="userStore.isMember">
        <template #header>
          <div class="card-header">
            <span>{{ $t('membership.currentPlan') }}</span>
          </div>
        </template>
        <div class="current-plan-info">
          <el-tag type="success" size="large">
            {{ userStore.user?.membership?.name }}
          </el-tag>
          <p class="expiry-date">
            到期时间: {{ formatDate(userStore.membershipExpiry) }}
          </p>
        </div>
      </el-card>

      <div class="membership-plans">
        <h2 class="section-title">{{ $t('membership.title') }}</h2>
        <el-row :gutter="20">
          <el-col :span="8" v-for="plan in membershipPlans" :key="plan.id">
            <el-card 
              class="plan-card" 
              :class="{ 'recommended': plan.type === 'premium' }"
              shadow="hover"
            >
              <template #header>
                <div class="plan-header">
                  <h3>{{ plan.name }}</h3>
                  <div class="plan-price">
                    <span class="price">¥{{ plan.price }}</span>
                    <span class="duration">/ {{ plan.duration }}天</span>
                  </div>
                </div>
              </template>
              
              <div class="plan-features">
                <ul>
                  <li v-for="feature in plan.features" :key="feature">
                    <el-icon class="feature-icon" color="#67c23a">
                      <Check />
                    </el-icon>
                    {{ feature }}
                  </li>
                </ul>
              </div>
              
              <div class="plan-actions">
                <el-button 
                  type="primary" 
                  size="large" 
                  @click="selectPlan(plan)"
                  :disabled="isCurrentPlan(plan)"
                  block
                >
                  {{ isCurrentPlan(plan) ? '当前套餐' : $t('membership.buyNow') }}
                </el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { usePaymentStore } from '@/stores/payment'
import type { MembershipPlan } from '@/types'
import { Check } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const paymentStore = usePaymentStore()

const membershipPlans = ref<MembershipPlan[]>([
  {
    id: 'basic',
    name: '基础版',
    type: 'basic',
    price: 29,
    duration: 30,
    features: [
      '每月10,000字翻译额度',
      '支持文本翻译',
      '基础客服支持',
      '多语言支持'
    ],
    isActive: false,
    translationQuota: 10000,
    prioritySupport: false
  },
  {
    id: 'premium',
    name: '专业版',
    type: 'premium',
    price: 99,
    duration: 30,
    features: [
      '每月50,000字翻译额度',
      '支持文本、文件、网页翻译',
      '优先客服支持',
      '多语言支持',
      '翻译历史记录',
      '批量翻译功能'
    ],
    isActive: false,
    translationQuota: 50000,
    prioritySupport: true
  },
  {
    id: 'enterprise',
    name: '企业版',
    type: 'enterprise',
    price: 299,
    duration: 30,
    features: [
      '无限翻译额度',
      '支持所有翻译类型',
      '专属客服支持',
      '多语言支持',
      '翻译历史记录',
      '批量翻译功能',
      'API接口调用',
      '团队协作功能'
    ],
    isActive: false,
    translationQuota: -1,
    prioritySupport: true
  }
])

const selectPlan = (plan: MembershipPlan) => {
  paymentStore.setSelectedPlan(plan)
  router.push('/payment')
}

const isCurrentPlan = (plan: MembershipPlan) => {
  return userStore.user?.membership?.id === plan.id && userStore.isMember
}

const formatDate = (dateString?: string) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('zh-CN')
}

onMounted(() => {
  // 这里可以从API获取最新的会员套餐信息
})
</script>

<style scoped>
.membership-view {
  padding: 20px 0;
}

.current-membership {
  margin-bottom: 30px;
}

.current-plan-info {
  text-align: center;
}

.expiry-date {
  margin-top: 10px;
  color: #666;
}

.section-title {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.plan-card {
  margin-bottom: 20px;
  position: relative;
}

.plan-card.recommended {
  border-color: #409eff;
}

.plan-card.recommended::before {
  content: '推荐';
  position: absolute;
  top: -10px;
  right: 20px;
  background: #409eff;
  color: white;
  padding: 5px 15px;
  border-radius: 10px;
  font-size: 12px;
}

.plan-header {
  text-align: center;
}

.plan-header h3 {
  margin: 0 0 10px 0;
  color: #333;
}

.plan-price {
  margin-bottom: 10px;
}

.price {
  font-size: 28px;
  font-weight: bold;
  color: #409eff;
}

.duration {
  color: #666;
  font-size: 14px;
}

.plan-features ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.plan-features li {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.feature-icon {
  margin-right: 8px;
}

.plan-actions {
  margin-top: 20px;
}
</style>