<template>
  <div class="payment-view">
    <div class="page-container">
      <el-card class="payment-card">
        <template #header>
          <div class="card-header">
            <h2>{{ $t('payment.title') }}</h2>
          </div>
        </template>

        <div v-if="!paymentStore.selectedPlan" class="no-plan">
          <el-empty description="请先选择会员套餐">
            <el-button type="primary" @click="$router.push('/membership')">
              选择套餐
            </el-button>
          </el-empty>
        </div>

        <div v-else class="payment-content">
          <!-- 订单信息 -->
          <div class="order-summary">
            <h3>订单信息</h3>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="套餐名称">
                {{ paymentStore.selectedPlan.name }}
              </el-descriptions-item>
              <el-descriptions-item label="套餐价格">
                ¥{{ paymentStore.selectedPlan.price }}
              </el-descriptions-item>
              <el-descriptions-item label="有效期">
                {{ paymentStore.selectedPlan.duration }}天
              </el-descriptions-item>
              <el-descriptions-item label="支付金额">
                <span class="total-amount">¥{{ paymentStore.selectedPlan.price }}</span>
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <!-- 支付方式 -->
          <div class="payment-methods">
            <h3>选择支付方式</h3>
            <el-radio-group v-model="selectedPaymentMethod" size="large">
              <el-radio-button label="zpay">Z-Pay</el-radio-button>
              <el-radio-button label="alipay">支付宝</el-radio-button>
              <el-radio-button label="wechat">微信支付</el-radio-button>
            </el-radio-group>
          </div>

          <!-- 支付按钮 -->
          <div class="payment-actions">
            <el-button 
              type="primary" 
              size="large" 
              @click="processPayment"
              :loading="paymentStore.paymentLoading"
              block
            >
              {{ paymentStore.paymentLoading ? $t('payment.processing') : '立即支付' }}
            </el-button>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePaymentStore } from '@/stores/payment'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { createPaymentOrder, processZPayPayment } from '@/utils/payment'

const router = useRouter()
const paymentStore = usePaymentStore()
const userStore = useUserStore()

const selectedPaymentMethod = ref('zpay')

const processPayment = async () => {
  if (!paymentStore.selectedPlan) {
    ElMessage.error('请选择会员套餐')
    return
  }

  if (!userStore.user) {
    ElMessage.error('请先登录')
    router.push('/login')
    return
  }

  try {
    paymentStore.setPaymentLoading(true)

    // 创建支付订单
    const orderData = {
      planId: paymentStore.selectedPlan.id,
      paymentMethod: selectedPaymentMethod.value,
      amount: paymentStore.selectedPlan.price,
      currency: 'CNY'
    }

    const order = await createPaymentOrder(orderData)
    paymentStore.setCurrentOrder(order)

    // 根据支付方式处理支付
    switch (selectedPaymentMethod.value) {
      case 'zpay':
        await handleZPayPayment(order)
        break
      case 'alipay':
        await handleAlipayPayment(order)
        break
      case 'wechat':
        await handleWechatPayment(order)
        break
      default:
        throw new Error('不支持的支付方式')
    }

  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '支付失败')
  } finally {
    paymentStore.setPaymentLoading(false)
  }
}

const handleZPayPayment = async (order: any) => {
  try {
    const paymentResult = await processZPayPayment({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      returnUrl: `${window.location.origin}/payment/success`,
      cancelUrl: `${window.location.origin}/payment/cancel`
    })

    if (paymentResult.paymentUrl) {
      // 跳转到支付页面
      window.location.href = paymentResult.paymentUrl
    } else {
      throw new Error('获取支付链接失败')
    }
  } catch (error) {
    throw new Error(`Z-Pay支付失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

const handleAlipayPayment = async (order: any) => {
  // 这里实现支付宝支付逻辑
  ElMessage.info('支付宝支付功能开发中...')
}

const handleWechatPayment = async (order: any) => {
  // 这里实现微信支付逻辑
  ElMessage.info('微信支付功能开发中...')
}
</script>

<style scoped>
.payment-view {
  padding: 20px 0;
}

.payment-card {
  max-width: 600px;
  margin: 0 auto;
}

.card-header h2 {
  margin: 0;
  text-align: center;
  color: #333;
}

.no-plan {
  text-align: center;
  padding: 40px 0;
}

.payment-content {
  padding: 20px 0;
}

.order-summary {
  margin-bottom: 30px;
}

.order-summary h3 {
  margin-bottom: 15px;
  color: #333;
}

.total-amount {
  font-size: 20px;
  font-weight: bold;
  color: #f56c6c;
}

.payment-methods {
  margin-bottom: 30px;
}

.payment-methods h3 {
  margin-bottom: 15px;
  color: #333;
}

.payment-actions {
  margin-top: 30px;
}

.el-radio-group {
  width: 100%;
}

.el-radio-button {
  flex: 1;
}
</style>