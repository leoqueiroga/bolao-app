<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-copa-blue-500 to-copa-blue-700 px-4 py-8">
    <div class="bg-white rounded-xl shadow-2xl p-8 md:p-12 max-w-md w-full">
      <!-- Logo/Título -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-copa-blue-500 mb-2">
          Bolão Copa
        </h1>
        <h2 class="text-2xl font-bold text-copa-blue-600">
          do Mundo
        </h2>
        <p class="text-gray-600 mt-4">
          Crie sua conta com Google e comece a participar!
        </p>
      </div>

      <!-- Mensagem de erro -->
      <div v-if="authStore.error" class="mb-6 bg-red-50 text-red-600 p-4 rounded-lg text-sm">
        {{ authStore.error }}
      </div>

      <!-- Botão Google -->
      <button
        @click="handleGoogleLogin"
        :disabled="authStore.loading"
        class="w-full flex items-center justify-center gap-3 px-6 py-4 border-2 border-gray-300 rounded-lg bg-white hover:bg-gray-50 hover:border-copa-blue-500 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg class="w-6 h-6" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        <span class="text-gray-700 font-semibold text-lg">
          {{ authStore.loading ? 'Conectando...' : 'Criar conta com Google' }}
        </span>
      </button>

      <!-- Footer -->
      <div class="mt-8 text-center">
        <p class="text-gray-600 text-sm">
          Já tem uma conta?
          <RouterLink to="/login" class="text-copa-blue-500 hover:text-copa-blue-600 font-semibold">
            Fazer login
          </RouterLink>
        </p>
        <p class="text-gray-500 text-sm mt-4">🏆 Faça seus palpites e dispute o ranking!</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import { RouterLink, useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()

const handleGoogleLogin = async () => {
  await authStore.loginWithGoogle()
  // O redirecionamento é feito automaticamente pelo Supabase
}
</script>
