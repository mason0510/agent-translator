import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, MembershipPlan } from '@/types'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const token = ref<string>('')
  
  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const isMember = computed(() => user.value?.membership?.isActive || false)
  const membershipExpiry = computed(() => user.value?.membership?.expiryDate)
  
  function setUser(userData: User) {
    user.value = userData
  }
  
  function setToken(userToken: string) {
    token.value = userToken
  }
  
  function updateMembership(membership: MembershipPlan) {
    if (user.value) {
      user.value.membership = membership
    }
  }
  
  function logout() {
    user.value = null
    token.value = ''
  }
  
  return {
    user,
    token,
    isLoggedIn,
    isMember,
    membershipExpiry,
    setUser,
    setToken,
    updateMembership,
    logout
  }
}, {
  persist: true
})