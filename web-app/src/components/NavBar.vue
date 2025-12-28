<template>
  <div class="navbar">
    <div class="page-container">
      <el-row justify="space-between" align="middle">
        <el-col :span="8">
          <div class="logo">
            <router-link to="/" class="logo-link">
              <el-icon class="logo-icon"><Switch /></el-icon>
              Translator Agent
            </router-link>
          </div>
        </el-col>
        <el-col :span="8">
          <el-menu mode="horizontal" :default-active="$route.name" router>
            <el-menu-item index="Home">{{ $t('nav.home') }}</el-menu-item>
            <el-menu-item index="Translate">{{ $t('nav.translate') }}</el-menu-item>
            <el-menu-item v-if="userStore.isLoggedIn" index="Membership">
              {{ $t('nav.membership') }}
            </el-menu-item>
          </el-menu>
        </el-col>
        <el-col :span="8">
          <div class="user-actions">
            <template v-if="userStore.isLoggedIn">
              <el-dropdown>
                <span class="el-dropdown-link">
                  <el-avatar :src="userStore.user?.avatar" />
                  {{ userStore.user?.username }}
                  <el-icon class="el-icon--right"><arrow-down /></el-icon>
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="logout">
                      {{ $t('nav.logout') }}
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
            <template v-else>
              <el-button text @click="$router.push('/login')">
                {{ $t('nav.login') }}
              </el-button>
              <el-button type="primary" @click="$router.push('/register')">
                {{ $t('nav.register') }}
              </el-button>
            </template>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowDown, Switch } from '@element-plus/icons-vue'

const userStore = useUserStore()
const router = useRouter()

const logout = () => {
  userStore.logout()
  ElMessage.success('已成功退出登录')
  router.push('/')
}
</script>

<style scoped>
.navbar {
  height: 60px;
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
}

.logo {
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
}

.logo-link {
  text-decoration: none;
  color: inherit;
  display: flex;
  align-items: center;
}

.logo-icon {
  margin-right: 8px;
  font-size: 24px;
}

.user-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.el-dropdown-link {
  cursor: pointer;
  color: #409eff;
  display: flex;
  align-items: center;
  gap: 8px;
}

.el-menu--horizontal {
  border-bottom: none;
}
</style>