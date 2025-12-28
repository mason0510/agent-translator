import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { PaymentOrder, MembershipPlan } from '@/types'

export const usePaymentStore = defineStore('payment', () => {
  const currentOrder = ref<PaymentOrder | null>(null)
  const selectedPlan = ref<MembershipPlan | null>(null)
  const paymentLoading = ref(false)
  
  function setSelectedPlan(plan: MembershipPlan) {
    selectedPlan.value = plan
  }
  
  function setCurrentOrder(order: PaymentOrder) {
    currentOrder.value = order
  }
  
  function setPaymentLoading(loading: boolean) {
    paymentLoading.value = loading
  }
  
  function clearPaymentData() {
    currentOrder.value = null
    selectedPlan.value = null
    paymentLoading.value = false
  }
  
  return {
    currentOrder,
    selectedPlan,
    paymentLoading,
    setSelectedPlan,
    setCurrentOrder,
    setPaymentLoading,
    clearPaymentData
  }
})