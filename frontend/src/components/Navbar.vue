<template>
  <nav class="bg-copa-blue-500 text-white shadow-lg">
    <div class="container mx-auto px-4">
      <div class="flex justify-between items-center h-16">
        <!-- Logo -->
        <div class="flex items-center">
          <RouterLink to="/" class="text-xl md:text-2xl font-bold">
            ⚽ Bolão Copa
          </RouterLink>
        </div>

        <!-- Desktop Menu -->
        <div class="hidden md:flex items-center space-x-4">
          <RouterLink to="/" class="hover:bg-copa-blue-600 px-3 py-2 rounded transition">
            Dashboard
          </RouterLink>
          <RouterLink to="/games" class="hover:bg-copa-blue-600 px-3 py-2 rounded transition">
            Jogos
          </RouterLink>
          <RouterLink to="/bets" class="hover:bg-copa-blue-600 px-3 py-2 rounded transition">
            Meus Palpites
          </RouterLink>
          <RouterLink to="/ranking" class="hover:bg-copa-blue-600 px-3 py-2 rounded transition">
            Ranking
          </RouterLink>
          <RouterLink v-if="authStore.isAdmin" to="/admin" class="hover:bg-copa-blue-600 px-3 py-2 rounded transition">
            Admin
          </RouterLink>
        </div>

        <!-- Desktop User Info -->
        <div class="hidden md:flex items-center space-x-4">
          <div class="text-right">
            <div class="font-semibold text-sm">{{ authStore.user?.name }}</div>
            <div class="text-xs">{{ authStore.user?.total_points || 0 }} pts</div>
          </div>

          <RouterLink to="/profile" class="flex items-center space-x-2 bg-copa-blue-600 hover:bg-copa-blue-700 px-3 py-1.5 rounded transition text-sm">
            <div v-if="authStore.user?.avatar_url" class="w-8 h-8 rounded-full overflow-hidden border-2 border-white">
              <img :src="authStore.user.avatar_url" :alt="authStore.user.name" class="w-full h-full object-cover" @error="handleAvatarError" />
            </div>
            <div v-else class="w-8 h-8 rounded-full bg-white flex items-center justify-center">
              <span class="text-copa-blue-600 font-semibold text-sm">
                {{ authStore.user?.name?.charAt(0)?.toUpperCase() || '?' }}
              </span>
            </div>
            <span>Perfil</span>
          </RouterLink>

          <button @click="handleLogout" class="bg-copa-blue-700 hover:bg-copa-blue-800 px-4 py-2 rounded transition text-sm">
            Sair
          </button>
        </div>

        <!-- Mobile Menu Button -->
        <button @click="mobileMenuOpen = !mobileMenuOpen" class="md:hidden p-2 rounded hover:bg-copa-blue-600 transition">
          <svg v-if="!mobileMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
          <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Mobile Menu -->
      <div v-if="mobileMenuOpen" class="md:hidden pb-4 border-t border-copa-blue-600 mt-2 pt-2">
        <div class="px-3 py-2 mb-2 bg-copa-blue-600 rounded flex items-center space-x-3">
          <div v-if="authStore.user?.avatar_url" class="w-10 h-10 rounded-full overflow-hidden border-2 border-white flex-shrink-0">
            <img :src="authStore.user.avatar_url" :alt="authStore.user.name" class="w-full h-full object-cover" @error="handleAvatarError" />
          </div>
          <div v-else class="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0">
            <span class="text-copa-blue-600 font-semibold">
              {{ authStore.user?.name?.charAt(0)?.toUpperCase() || '?' }}
            </span>
          </div>
          <div>
            <div class="font-semibold">{{ authStore.user?.name }}</div>
            <div class="text-sm">{{ authStore.user?.total_points || 0 }} pontos</div>
          </div>
        </div>

        <RouterLink @click="mobileMenuOpen = false" to="/" class="block hover:bg-copa-blue-600 px-3 py-2 rounded transition mb-1">
          📊 Dashboard
        </RouterLink>
        <RouterLink @click="mobileMenuOpen = false" to="/games" class="block hover:bg-copa-blue-600 px-3 py-2 rounded transition mb-1">
          ⚽ Jogos
        </RouterLink>
        <RouterLink @click="mobileMenuOpen = false" to="/bets" class="block hover:bg-copa-blue-600 px-3 py-2 rounded transition mb-1">
          🎯 Meus Palpites
        </RouterLink>
        <RouterLink @click="mobileMenuOpen = false" to="/ranking" class="block hover:bg-copa-blue-600 px-3 py-2 rounded transition mb-1">
          🏆 Ranking
        </RouterLink>
        <RouterLink v-if="authStore.isAdmin" @click="mobileMenuOpen = false" to="/admin" class="block hover:bg-copa-blue-600 px-3 py-2 rounded transition mb-1">
          ⚙️ Admin
        </RouterLink>

        <div class="mt-3 pt-3 border-t border-copa-blue-600 space-y-2">
          <RouterLink @click="mobileMenuOpen = false" to="/profile" class="block bg-copa-blue-600 hover:bg-copa-blue-700 px-3 py-2 rounded transition text-center">
            👤 Perfil
          </RouterLink>
          <button @click="handleLogout" class="w-full bg-copa-blue-700 hover:bg-copa-blue-800 px-3 py-2 rounded transition">
            🚪 Sair
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const mobileMenuOpen = ref(false)

const handleLogout = async () => {
  mobileMenuOpen.value = false
  await authStore.logout()
  router.push('/login')
}

const handleAvatarError = (event) => {
  event.target.style.display = 'none'
}
</script>
