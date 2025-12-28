<template>
  <div class="payment-success-view">
    <div class="page-container">
      <el-card class="success-card">
        <div class="success-content">
          <el-result
            icon="success"
            title="支付成功"
            sub-title="恭喜您，会员购买成功！"
          >
            <template #extra>
              <div class="success-info">
                <p v-if="orderInfo">订单号: {{ orderInfo.id }}</p>
                <p v-if="orderInfo">支付金额: ¥{{ orderInfo.amount }}</p>
                <p>会员权益已生效，请前往会员中心查看</p>
              </div>
              <div class="success-actions">
                <el-button type="primary" @click="goToMembership">
                  查看会员中心
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
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePaymentStore } from '@/stores/payment'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { verifyPayment } from '@/utils/payment'

const router = useRouter()
const route = useRoute()
const paymentStore = usePaymentStore()
const userStore = useUserStore()

const orderInfo = ref<any>(null)

const goToMembership = () => {
  router.push('/membership')
}

const backToHome = () => {
  router.push('/')
}

onMounted(async () => {
  const orderId = route.query.order_id as string
  const paymentId = route.query.payment_id as string

  if (orderId && paymentId) {
    try {
      // 验证支付结果
      const result = await verifyPayment(orderId, paymentId)
      
      if (result.success) {
        orderInfo.value = result.order
        
        // 更新用户会员信息
        if (result.membership) {
          userStore.updateMembership(result.membership)
        }
        
        // 清除支付相关状态
        paymentStore.clearPaymentData()
        
        ElMessage.success('会员购买成功！')
      } else {
        ElMessage.error('支付验证失败，请联系客服')
        router.push('/payment/cancel')
      }
    } catch (error) {
      ElMessage.error('支付验证出错，请联系客服')
      router.push('/payment/cancel')
    }
  } else {
    ElMessage.error('缺少支付信息')
    router.push('/membership')
  }
})
</script>

<style scoped>
.payment-success-view {
  padding: 20px 0;
}

.success-card {
  max-width: 600px;
  margin: 0 auto;
}

.success-content {
  padding: 20px;
  text-align: center;
}

.success-info {
  margin: 20px 0;
}

.success-info p {
  margin: 10px 0;
  color: #666;
}

.success-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
}
</style>