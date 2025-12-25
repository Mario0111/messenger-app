<script setup>
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import axios from 'axios'

const props = defineProps(['conversationId', 'recipient'])
const messages = ref([])
const newMessage = ref('')
const currentUser = ref(JSON.parse(sessionStorage.getItem('user') || '{}'))
const messagesContainer = ref(null)
const typingUsers = ref([])
const isRecording = ref(false)
const mediaRecorder = ref(null)
const audioChunks = ref([])

let interval = null
let typingTimeout = null

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
    const token = sessionStorage.getItem('token')
    const response = await axios.get(`http://localhost:3000/api/chat/${props.conversationId}/messages`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    // Response format verification (handle array vs object migration)
    let msgs = []
    let typers = []
    
    if (Array.isArray(response.data)) {
        msgs = response.data
    } else {
        msgs = response.data.messages || []
        typers = response.data.typingUsers || []
    }

    // Map typing user IDs to names
    if (props.recipient) {
       // Filter out self
       typers = typers.filter(id => id !== currentUser.value.id)
       // Resolve names
       if (typers.length > 0) {
           typingUsers.value = typers.map(id => {
               if (props.recipient.id === id) return props.recipient.username
               if (props.recipient.members) {
                   const m = props.recipient.members.find(mem => mem.id === id)
                   return m ? m.username : 'Someone'
               }
               return 'Someone'
           })
       } else {
           typingUsers.value = []
       }
    }

    const shouldScroll = msgs.length > messages.value.length || messages.value.length === 0
    messages.value = msgs
    
    if (shouldScroll) {
       scrollToBottom()
    }
  } catch (error) {
    console.error('Error fetching messages', error)
  }
}

const emit = defineEmits(['message-sent'])

const sendTyping = async () => {
    if (!props.conversationId) return
    try {
        const token = sessionStorage.getItem('token')
        await axios.post(`http://localhost:3000/api/chat/${props.conversationId}/typing`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        })
    } catch (e) {}
}

const handleTyping = () => {
    if (typingTimeout) clearTimeout(typingTimeout)
    sendTyping() 
    typingTimeout = setTimeout(() => {
       // Stop typing logic handled by backend timeout usually
    }, 2000)
}

const sendMessage = async () => {
  if (!newMessage.value.trim() || !props.conversationId) return

  try {
    const token = sessionStorage.getItem('token')
    const content = newMessage.value
    newMessage.value = '' // Optimistic clear
    
    await axios.post(`http://localhost:3000/api/chat/${props.conversationId}/messages`, {
      content
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    await fetchMessages()
    scrollToBottom()
    emit('message-sent')
  } catch (error) {
    console.error('Error sending message', error)
  }
}

const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return
    uploadFile(file)
}

const uploadFile = async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    
    try {
        const token = sessionStorage.getItem('token')
        await axios.post(`http://localhost:3000/api/chat/${props.conversationId}/media`, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            }
        })
        fetchMessages()
        scrollToBottom()
        emit('message-sent')
    } catch (error) {
        console.error("Upload failed", error)
    }
}

// Voice Logic
const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        mediaRecorder.value = new MediaRecorder(stream)
        audioChunks.value = []
        
        mediaRecorder.value.ondataavailable = (event) => {
            audioChunks.value.push(event.data)
        }
        
        mediaRecorder.value.onstop = async () => {
            const audioBlob = new Blob(audioChunks.value, { type: 'audio/webm' })
            const audioFile = new File([audioBlob], 'voice_note.webm', { type: 'audio/webm' })
            await uploadFile(audioFile)
        }
        
        mediaRecorder.value.start()
        isRecording.value = true
    } catch (err) {
        console.error("Error accessing microphone", err)
        alert("Could not access microphone.")
    }
}

const stopRecording = () => {
    if (mediaRecorder.value && isRecording.value) {
        mediaRecorder.value.stop()
        isRecording.value = false
        mediaRecorder.value.stream.getTracks().forEach(track => track.stop())
    }
}

const toggleReaction = async (msg) => {
    try {
        const token = sessionStorage.getItem('token')
        // Optimistic update
        msg.userReacted = !msg.userReacted
        msg.reactionCount += msg.userReacted ? 1 : -1
        
        await axios.post(`http://localhost:3000/api/chat/messages/${msg.id}/react`, {
            reaction: 'heart' 
        }, {
             headers: { Authorization: `Bearer ${token}` }
        })
    } catch (e) {
        console.error(e)
    }
}

const openImage = (url) => {
    window.open(url, '_blank')
}

watch(() => props.conversationId, (newId) => {
  if (newId) {
    messages.value = []
    typingUsers.value = []
    fetchMessages()
    if (interval) clearInterval(interval)
    interval = setInterval(fetchMessages, 2000)
  }
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})
</script>

<template>
  <div class="flex flex-col h-full bg-transparent relative">
    <!-- Header -->
    <div class="px-8 py-5 bg-white/5 backdrop-blur-md border-b border-white/5 flex items-center justify-between z-10 shadow-lg" v-if="recipient">
      <div class="flex items-center space-x-4">
         <div class="relative">
             <img 
               v-if="recipient.avatarUrl" 
               :src="recipient.avatarUrl" 
               class="h-12 w-12 rounded-full object-cover border-2 border-white/10 shadow-md"
             />
             <div v-else class="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg border border-white/10">
                {{ recipient.username ? recipient.username.charAt(0).toUpperCase() : '?' }}
             </div>
             <div class="absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-[#1e293b] rounded-full"
                :class="recipient.isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-gray-500'"></div>
         </div>
         <div>
            <h3 class="text-xl font-bold text-white leading-tight tracking-wide">{{ recipient.username }}</h3>
            <div class="flex items-center text-xs font-semibold mt-0.5 min-h-[1rem]">
               <span v-if="typingUsers.length > 0" class="text-indigo-300 animate-pulse flex items-center">
                   <span class="mr-1">
                       {{ typingUsers.length === 1 ? `${typingUsers[0]} is typing` : (typingUsers.length === 2 ? `${typingUsers.join(' & ')} are typing` : 'Multiple people are typing') }}
                   </span>
                   <span class="flex space-x-0.5">
                        <span class="w-1 h-1 bg-indigo-300 rounded-full animate-bounce" style="animation-delay: 0s"></span>
                        <span class="w-1 h-1 bg-indigo-300 rounded-full animate-bounce" style="animation-delay: 0.1s"></span>
                        <span class="w-1 h-1 bg-indigo-300 rounded-full animate-bounce" style="animation-delay: 0.2s"></span>
                   </span>
               </span>
               <span v-else :class="recipient.isOnline ? 'text-emerald-400' : 'text-gray-400'">
                  {{ recipient.isOnline ? 'Active Now' : 'Offline' }}
               </span>
            </div>
         </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!recipient" class="flex-1 flex flex-col items-center justify-center text-white/40">
       <div class="w-32 h-32 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full flex items-center justify-center mb-6 blur-md">
         <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-white/60" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd" />
         </svg>
       </div>
       <h3 class="text-3xl font-bold text-white mb-2 tracking-tight">Welcome</h3>
       <p class="text-indigo-200/60 max-w-xs text-center font-light text-lg">Select a conversation to start messaging.</p>
    </div>

    <!-- Messages -->
    <div v-else class="flex-1 overflow-y-auto p-8 space-y-6 flex flex-col custom-scrollbar" ref="messagesContainer">
      <div v-if="messages.length === 0" class="flex-1 flex flex-col items-center justify-center text-gray-400">
         <div class="bg-white/10 p-6 rounded-full shadow-lg mb-4 backdrop-blur-sm border border-white/5">
             <span class="text-4xl animate-wave">👋</span>
         </div>
         <p class="font-medium text-indigo-200">No messages yet.</p>
         <p class="text-sm text-gray-500">Break the ice with {{ recipient.username }}!</p>
      </div>

      <div 
        v-for="msg in messages" 
        :key="msg.id" 
        class="flex flex-col max-w-[75%]"
        :class="msg.sender.id === currentUser.id ? 'self-end items-end' : 'self-start items-start'"
      >
        <div class="text-xs font-bold mb-1 px-2" 
             :class="msg.sender.id === currentUser.id ? 'text-indigo-300' : 'text-indigo-400 opacity-100'">
           {{ msg.sender.id === currentUser.id ? 'You' : msg.sender.username }}
        </div>
        
        <div 
          class="relative text-sm leading-relaxed group/msg"
          @dblclick="toggleReaction(msg)"
          :class="msg.type === 'image'
            ? 'bg-transparent'
            : (msg.sender.id === currentUser.id 
                ? 'px-6 py-3.5 rounded-2xl rounded-tr-sm shadow-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-indigo-500/20 border border-white/5 backdrop-blur-sm' 
                : 'px-6 py-3.5 rounded-2xl rounded-tl-sm shadow-lg bg-white/10 text-gray-100 hover:bg-white/15 transition-colors border border-white/5 backdrop-blur-sm')"
        >
          <div v-if="msg.type === 'image'" class="mb-1">
             <img :src="msg.mediaUrl" class="max-w-[200px] sm:max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity" @click="openImage(msg.mediaUrl)" />
          </div>
          <div v-else-if="msg.type === 'audio'" class="min-w-[200px]">
             <audio controls :src="msg.mediaUrl" class="w-full h-8 opacity-90"></audio>
          </div>
          <span v-else class="whitespace-pre-wrap">{{ msg.content }}</span>

          <!-- Reaction -->
          <div v-if="msg.userReacted || msg.reactionCount > 0" 
               class="absolute -bottom-2 -right-2 bg-white/10 backdrop-blur-md rounded-full px-1.5 py-0.5 border border-white/10 shadow-sm flex items-center space-x-0.5 text-[10px]"
               title="Double click to like">
              <span class="text-red-400">❤️</span>
              <span v-if="msg.reactionCount > 1" class="text-white font-bold">{{ msg.reactionCount }}</span>
          </div>
        </div>
        
        <div class="text-[10px] text-gray-500 mt-1 px-1 font-medium flex items-center space-x-1">
          <span>{{ new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}</span>
          <span v-if="msg.sender.id === currentUser.id && msg.isRead" class="text-indigo-400" title="Read">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
               <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
               <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd" />
             </svg>
          </span>
        </div>
      </div>
    </div>

    <!-- Input -->
    <div v-if="recipient" class="p-6 bg-white/5 backdrop-blur-md border-t border-white/5 relative z-20">
      <form @submit.prevent="sendMessage" class="relative group flex items-center space-x-2">
        <!-- File Input -->
        <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="handleFileUpload">
        
        <!-- Attach Btn -->
        <button 
            type="button" 
            @click="$refs.fileInput.click()"
            class="h-10 w-10 shrink-0 bg-white/10 text-gray-400 rounded-full hover:bg-white/20 hover:text-indigo-300 transition-all flex items-center justify-center border border-white/5"
            title="Attach Image"
        >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
        </button>

        <!-- Mic Btn -->
        <button 
            type="button" 
            @click="isRecording ? stopRecording() : startRecording()"
            class="h-10 w-10 shrink-0 rounded-full transition-all flex items-center justify-center border border-white/5 shadow-lg"
            :class="isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-red-400'"
            title="Voice Note"
        >
            <svg v-if="!isRecording" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
        </button>

        <!-- Text Input -->
        <textarea 
            v-model="newMessage" 
            @keydown.enter.prevent="sendMessage"
            @input="handleTyping"
            :placeholder="isRecording ? 'Recording audio...' : 'Type your message...'"
            :disabled="isRecording"
            class="flex-1 pl-6 pr-14 py-4 bg-black/30 border border-white/10 rounded-3xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-black/50 transition-all resize-none text-white placeholder-gray-500 shadow-inner"
            rows="1"
            style="min-height: 56px; max-height: 120px;"
        ></textarea>
        
        <button 
          v-if="!isRecording"
          type="submit" 
          class="absolute right-2 bottom-2 h-10 w-10 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-indigo-500/50 disabled:opacity-50 disabled:shadow-none flex items-center justify-center transform hover:scale-105 active:scale-95 z-10"
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
