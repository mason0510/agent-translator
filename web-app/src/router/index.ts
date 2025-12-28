import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('@/views/home/HomeView.vue')
    },
    {
      path: '/translate',
      name: 'Translate',
      component: () => import('@/views/home/TranslateView.vue')
    },
    {
      path: '/membership',
      name: 'Membership',
      component: () => import('@/views/membership/MembershipView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/payment',
      name: 'Payment',
      component: () => import('@/views/payment/PaymentView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/payment/success',
      name: 'PaymentSuccess',
      component: () => import('@/views/payment/PaymentSuccessView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/payment/cancel',
      name: 'PaymentCancel',
      component: () => import('@/views/payment/PaymentCancelView.vue')
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/auth/LoginView.vue')
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('@/views/auth/RegisterView.vue')
    }
  ]
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router