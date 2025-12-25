<template>
  <div class="flex items-center justify-center min-h-screen bg-[#0f172a] relative overflow-hidden">
    <!-- Background Elements -->
    <!-- Background Elements -->
    <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/40 rounded-full mix-blend-screen filter blur-[128px] opacity-30 animate-pulse"></div>
    <div class="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/40 rounded-full mix-blend-screen filter blur-[128px] opacity-30 animate-pulse animation-delay-2000"></div>
    <div class="absolute -bottom-32 left-20 w-[40%] h-[40%] bg-pink-900/40 rounded-full mix-blend-screen filter blur-[128px] opacity-30 animate-pulse animation-delay-4000"></div>

    <div class="w-full max-w-md p-8 space-y-8 bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 z-10 relative">
      <div class="text-center">
        <h1 class="text-4xl font-bold text-white tracking-tight mb-2">Welcome Back</h1>
        <p class="text-gray-300">Sign in to continue to Nebula</p>
      </div>
      
      <form @submit.prevent="handleLogin" class="space-y-6">
        <div class="space-y-4">
          <div>
            <label for="username" class="block text-sm font-medium text-gray-300 mb-1">Username</label>
            <input
              v-model="username"
              type="text"
              id="username"
              required
              class="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-black/30 text-white placeholder-gray-500 transition-all font-light"
              placeholder="Enter your username"
            />
          </div>
          <div>
            <label for="password" class="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input
              v-model="password"
              type="password"
              id="password"
              required
              class="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-black/30 text-white placeholder-gray-500 transition-all font-light"
              placeholder="Enter your password"
            />
          </div>
        </div>

        <div v-if="error" class="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-sm text-center">
          {{ error }}
        </div>

        <button
          type="submit"
          class="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 transform transition-all active:scale-[0.98] shadow-lg shadow-indigo-500/30"
        >
          Sign In
        </button>
      </form>
      
      <p class="text-center text-gray-400 text-sm">
        Don't have an account? <router-link to="/register" class="text-white hover:text-purple-300 font-medium transition-colors">Sign up now</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const username = ref('')
const password = ref('')
const error = ref('')
const router = useRouter()

const handleLogin = async () => {
  try {
    error.value = ''
    const response = await axios.post('http://localhost:3000/api/auth/login', {
      username: username.value,
      password: password.value
    })
    
    sessionStorage.setItem('token', response.data.token)
    sessionStorage.setItem('user', JSON.stringify(response.data.user))
    
    router.push('/')
  } catch (err) {
    error.value = err.response?.data?.error || 'Login failed'
  }
}
</script>
