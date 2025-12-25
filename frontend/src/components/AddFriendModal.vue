<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity">
    <div class="bg-[#1e293b]/90 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform scale-100 border border-white/10">
      
      <!-- Hero Header -->
      <div class="px-8 py-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white relative overflow-hidden">
        <div class="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
        <h3 class="text-2xl font-bold tracking-tight relative z-10">Add Friend</h3>
        <p class="text-indigo-100 text-sm mt-1 relative z-10">Expand your network</p>
        <button @click="$emit('close')" class="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-20">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
      </div>

      <div class="p-8">
        <form @submit.prevent="sendRequest" class="space-y-6">
          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Username</label>
            <div class="relative group">
              <span class="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500 group-focus-within:text-indigo-400 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                </svg>
              </span>
              <input 
                v-model="username" 
                type="text" 
                class="w-full pl-12 pr-4 py-4 bg-black/30 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-black/40 transition-all text-white placeholder-gray-500 font-medium"
                placeholder="exact_username"
                required
              />
            </div>
            <p class="mt-2 text-xs text-gray-500 ml-1">Type the exact username of your friend.</p>
          </div>

          <div v-if="message" class="p-4 rounded-2xl text-sm font-semibold flex items-center space-x-2 border border-white/5" :class="isError ? 'bg-red-500/10 text-red-300' : 'bg-green-500/10 text-green-300'">
            <span v-if="!isError">✓</span>
            <span v-if="isError">!</span>
            <span>{{ message }}</span>
          </div>

          <div class="flex space-x-3 pt-2">
            <button 
              type="button" 
              @click="$emit('close')" 
              class="flex-1 px-4 py-3.5 text-gray-300 bg-white/5 hover:bg-white/10 rounded-2xl font-bold transition-colors border border-white/5"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              class="flex-1 px-4 py-3.5 text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 rounded-2xl font-bold shadow-lg shadow-indigo-500/30 transition-all transform hover:-translate-y-1"
            >
              Send Request
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'

const emit = defineEmits(['close'])
const username = ref('')
const message = ref('')
const isError = ref(false)

const sendRequest = async () => {
  try {
    message.value = ''
    isError.value = false
    const token = sessionStorage.getItem('token')
    await axios.post('http://localhost:3000/api/friends/request', {
      receiverUsername: username.value
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    message.value = 'Friend request sent!'
    setTimeout(() => emit('close'), 1500)
  } catch (error) {
    isError.value = true
    message.value = error.response?.data?.error || 'Failed to send request'
  }
}
</script>
