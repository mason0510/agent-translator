<template>
  <div class="payment-cancel-view">
    <div class="page-container">
      <el-card class="cancel-card">
        <div class="cancel-content">
          <el-result
            icon="warning"
            title="支付已取消"
            sub-title="您已取消支付，如有疑问请联系客服"
          >
            <template #extra>
              <div class="cancel-info">
                <p>支付已取消，未产生任何费用</p>
                <p>如需购买会员，请重新选择套餐进行支付</p>
              </div>
              <div class="cancel-actions">
                <el-button type="primary" @click="retryPayment">
                  重试支付
                </el-button>
                <el-button @click="backToHome">
                  返回首页
                </el-button>
              </div>
            </template>
          </el-result>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { usePaymentStore } from '@/stores/payment'

const router = useRouter()
const paymentStore = usePaymentStore()

const retryPayment = () => {
  if (paymentStore.selectedPlan) {
    router.push('/payment')
  } else {
    router.push('/membership')
  }
}

const backToHome = () => {
  paymentStore.clearPaymentData()
  router.push('/')
}
</script>

<style scoped>
.payment-cancel-view {
  padding: 20px 0;
}

.cancel-card {
  max-width: 600px;
  margin: 0 auto;
}

.cancel-content {
  padding: 20px;
  text-align: center;
}

.cancel-info {
  margin: 20px 0;
}

.cancel-info p {
  margin: 10px 0;
  color: #666;
}

.cancel-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
}
</style>