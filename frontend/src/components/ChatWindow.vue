<template>
  <div class="flex flex-col h-full bg-slate-50 relative">
    <!-- Header -->
    <div class="px-8 py-5 bg-white border-b border-gray-100 flex items-center justify-between z-10 shadow-sm">
      <div v-if="recipient" class="flex items-center space-x-4">
         <div class="relative">
             <div class="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-md">
                {{ recipient.username.charAt(0).toUpperCase() }}
             </div>
             <div class="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
         </div>
         <div>
            <h3 class="text-xl font-bold text-gray-800 leading-tight">{{ recipient.username }}</h3>
            <div class="flex items-center text-xs text-green-600 font-semibold mt-0.5">
               Online Now
            </div>
         </div>
      </div>
      <div v-else class="text-gray-400 font-medium">No chat selected</div>
    </div>

    <!-- Messages -->
    <div class="flex-1 overflow-y-auto p-8 space-y-6 flex flex-col" ref="messagesContainer">
      <div v-if="!recipient" class="flex-1 flex flex-col items-center justify-center text-gray-400 opacity-60">
        <!-- Illustration -->
        <svg xmlns="http://www.w3.org/2000/svg" class="h-48 w-48 text-indigo-100 mb-6" viewBox="0 0 20 20" fill="currentColor">
             <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd" />
        </svg>
        <h3 class="text-2xl font-bold text-gray-800 mb-2">Welcome to Messenger</h3>
        <p class="text-gray-500 max-w-xs text-center">Select a friend from the sidebar to start a conversation.</p>
      </div>

      <div v-else-if="messages.length === 0" class="flex-1 flex flex-col items-center justify-center text-gray-400">
         <div class="bg-white p-6 rounded-full shadow-sm mb-4">
             <span class="text-4xl">👋</span>
         </div>
         <p class="font-medium text-gray-500">No messages here yet.</p>
         <p class="text-sm text-gray-400">Say hello to {{ recipient.username }}!</p>
      </div>

      <div 
        v-for="msg in messages" 
        :key="msg.id" 
        class="flex flex-col max-w-[75%]"
        :class="msg.sender.id === currentUser.id ? 'self-end items-end' : 'self-start items-start'"
      >
        <div class="text-[10px] font-bold tracking-wider uppercase mb-1 px-2" :class="msg.sender.id === currentUser.id ? 'text-indigo-400' : 'text-gray-400'">
           {{ msg.sender.id === currentUser.id ? 'You' : msg.sender.username }}
        </div>
        <div 
          class="px-6 py-3.5 rounded-2xl shadow-sm text-sm leading-relaxed relative"
          :class="msg.sender.id === currentUser.id 
            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-tr-none' 
            : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none'"
        >
          {{ msg.content }}
        </div>
        <div class="text-[10px] text-gray-300 mt-1 px-1 font-medium">
          {{ new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}
        </div>
      </div>
    </div>

    <!-- Input -->
    <div v-if="recipient" class="p-6 bg-white border-t border-gray-100">
      <form @submit.prevent="sendMessage" class="relative group">
        <textarea 
            v-model="newMessage" 
            @keydown.enter.prevent="sendMessage"
            placeholder="Type a message..."
            class="w-full pl-6 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-none text-gray-700 placeholder-gray-400 shadow-inner"
            rows="1"
            style="min-height: 56px; max-height: 120px;"
        ></textarea>
        <button 
          type="submit" 
          class="absolute right-2 bottom-2 h-10 w-10 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none flex items-center justify-center transform hover:scale-105 active:scale-95"
          :disabled="!newMessage.trim()"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transform rotate-90 ml-0.5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import axios from 'axios'

const props = defineProps(['conversationId', 'recipient'])
const messages = ref([])
const newMessage = ref('')
const currentUser = ref(JSON.parse(localStorage.getItem('user') || '{}'))
const messagesContainer = ref(null)
let interval = null

const scrollToBottom = () => {
    nextTick(() => {
        if (messagesContainer.value) {
            messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
        }
    })
}

const fetchMessages = async () => {
  if (!props.conversationId) return
  
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get(`http://localhost:3000/api/chat/${props.conversationId}/messages`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    // Only scroll if new messages arrived
    if (response.data.length > messages.length) {
       messages.value = response.data
       scrollToBottom()
    } else {
        messages.value = response.data
    }
  } catch (error) {
    console.error('Error fetching messages', error)
  }
}

const sendMessage = async () => {
  if (!newMessage.value.trim() || !props.conversationId) return

  try {
    const token = localStorage.getItem('token')
    const content = newMessage.value
    newMessage.value = '' // Optimistic clear
    
    await axios.post(`http://localhost:3000/api/chat/${props.conversationId}/messages`, {
      content
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    await fetchMessages()
    scrollToBottom()
  } catch (error) {
    console.error('Error sending message', error)
  }
}

watch(() => props.conversationId, (newId) => {
  if (newId) {
    messages.value = []
    fetchMessages()
    if (interval) clearInterval(interval)
    interval = setInterval(fetchMessages, 3000)
  }
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})
</script>
