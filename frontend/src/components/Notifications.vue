<template>
  <div class="relative">
    <button @click="isOpen = !isOpen" class="relative p-2 text-gray-600 hover:text-indigo-600 transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      <span v-if="requests.length > 0" class="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
        {{ requests.length }}
      </span>
    </button>

    <div v-if="isOpen" class="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl overflow-hidden z-50 border border-gray-100">
      <div v-if="requests.length === 0" class="p-4 text-center text-gray-500 text-sm">
        No pending requests
      </div>
      <ul v-else class="divide-y divide-gray-100">
        <li v-for="req in requests" :key="req.id" class="p-4 hover:bg-gray-50 transition-colors">
          <div class="flex items-center justify-between">
            <span class="font-medium text-gray-800">{{ req.username }}</span>
            <span class="text-xs text-gray-400">{{ new Date(req.createdAt).toLocaleDateString() }}</span>
          </div>
          <div class="mt-3 flex space-x-2">
            <button @click="accept(req.id)" class="flex-1 px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded hover:bg-indigo-200 transition-colors">
              Accept
            </button>
            <button @click="decline(req.id)" class="flex-1 px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded hover:bg-gray-200 transition-colors">
              Decline
            </button>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import axios from 'axios'

const requests = ref([])
const isOpen = ref(false)
let interval = null
const emit = defineEmits(['friend-added'])

const fetchRequests = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get('http://localhost:3000/api/friends/requests', {
      headers: { Authorization: `Bearer ${token}` }
    })
    requests.value = response.data
  } catch (error) {
    console.error('Error fetching requests', error)
  }
}

const accept = async (requestId) => {
  try {
    const token = localStorage.getItem('token')
    await axios.post('http://localhost:3000/api/friends/accept', { requestId }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    await fetchRequests()
    emit('friend-added') // Trigger refresh of friend list
  } catch (error) {
    console.error(error)
  }
}

const decline = async (requestId) => {
 try {
    const token = localStorage.getItem('token')
    await axios.post('http://localhost:3000/api/friends/decline', { requestId }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    await fetchRequests()
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  fetchRequests()
  interval = setInterval(fetchRequests, 5000)
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})
</script>
