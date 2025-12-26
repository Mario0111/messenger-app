<template>
  <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl border border-gray-700 overflow-hidden transform transition-all scale-100">
      <div class="p-6">
        <div class="flex justify-between items-center mb-6">
          <div class="flex items-center space-x-3">
             <div class="p-2 bg-indigo-500/20 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
             </div>
             <h3 class="text-xl font-bold text-white">Settings</h3>
          </div>
          <button @click="$emit('close')" class="text-gray-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form @submit.prevent="submit" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-400 mb-1">Current Password</label>
                <input v-model="form.currentPassword" type="password" required placeholder="Enter current password"
                    class="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all">
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-400 mb-1">New Password</label>
                <input v-model="form.newPassword" type="password" required placeholder="Enter new password"
                    class="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all">
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-400 mb-1">Confirm New Password</label>
                <input v-model="form.confirmPassword" type="password" required placeholder="Confirm new password"
                    class="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all">
            </div>

             <div v-if="error" class="text-red-400 text-sm bg-red-400/10 p-2 rounded-lg border border-red-400/20">
                {{ error }}
            </div>

             <div v-if="success" class="text-green-400 text-sm bg-green-400/10 p-2 rounded-lg border border-green-400/20">
                {{ success }}
            </div>
            
            <div class="flex justify-end gap-3 pt-4">
                <button type="button" @click="$emit('close')" 
                    class="px-4 py-2 text-gray-400 hover:text-white font-medium transition-colors">
                    Cancel
                </button>
                <button type="submit" 
                    class="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/30 transition-all transform hover:scale-[1.02] active:scale-[0.98]">
                    Change Password
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
const form = ref({ currentPassword: '', newPassword: '', confirmPassword: '' })
const error = ref('')
const success = ref('')

const submit = async () => {
    error.value = ''
    success.value = ''

    if (form.value.newPassword !== form.value.confirmPassword) {
        error.value = 'New passwords do not match'
        return
    }

    if (form.value.newPassword.length < 6) {
        error.value = 'Password must be at least 6 characters'
        return
    }

    try {
        const token = sessionStorage.getItem('token')
        await axios.post('http://localhost:3000/api/auth/change-password', {
            currentPassword: form.value.currentPassword,
            newPassword: form.value.newPassword
        }, {
             headers: { Authorization: `Bearer ${token}` }
        })
        success.value = 'Password changed successfully!'
        form.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
        setTimeout(() => emit('close'), 1500)
    } catch (e) {
        error.value = e.response?.data?.error || 'Failed to change password'
    }
}
</script>
