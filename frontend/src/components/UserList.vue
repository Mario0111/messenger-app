<script setup>
import axios from 'axios'

const props = defineProps(['items', 'selectedId', 'currentUser'])
const emit = defineEmits(['select', 'logout', 'open-add-friend', 'open-create-group', 'refresh', 'upload-avatar'])

const handleAvatarUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('avatar', file)

    try {
        const token = sessionStorage.getItem('token')
        await axios.post('http://localhost:3000/api/users/avatar', formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            }
        })
        emit('upload-avatar')
    } catch (error) {
        console.error("Avatar upload failed", error)
    }
}
</script>

<template>
  <div class="h-full flex flex-col bg-transparent text-white">
    <!-- Header -->
    <div class="p-6 bg-white/5 border-b border-white/10 flex justify-between items-center backdrop-blur-md">
      <div>
        <h2 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 tracking-wide">Nebula</h2>
      </div>
      <button @click="$emit('refresh')" class="p-2 bg-white/10 hover:bg-white/20 rounded-full text-indigo-300 transition-all shadow-inner border border-white/5 group" title="Refresh List">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>
    
    <!-- Action Bar -->
    <div class="p-4 grid grid-cols-2 gap-2">
      <button 
        @click="$emit('open-add-friend')"
        class="py-3 px-3 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-2xl transition-all duration-200 flex items-center justify-center space-x-1 border border-white/10 text-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
        <span>Add Friend</span>
      </button>
       <button 
        @click="$emit('open-create-group')"
        class="py-3 px-3 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-2xl transition-all duration-200 flex items-center justify-center space-x-1 border border-white/10 text-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span>New Group</span>
      </button>
    </div>
    
    <!-- List (Conversations) -->
    <div class="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
      <div v-if="items.length === 0" class="text-center py-10 opacity-60">
         <p class="text-gray-400 font-medium">No chats yet.</p>
         <p class="text-gray-500 text-sm">Start a conversation!</p>
      </div>

      <div 
        v-for="item in items" 
        :key="item.id"
        @click="$emit('select', item)"
        class="group p-3 rounded-2xl cursor-pointer transition-all duration-200 border border-transparent flex items-center space-x-4 relative"
        :class="selectedId === item.id ? 'bg-white/10 border-white/10 shadow-lg backdrop-blur-sm' : 'hover:bg-white/5 text-gray-300'"
      >
        <div class="relative">
           <!-- Avatar -->
           <img 
              v-if="item.avatarUrl" 
              :src="item.avatarUrl" 
              class="h-12 w-12 rounded-full object-cover border-2 border-white/10 shadow-sm"
           />
           <div v-else class="h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold shadow-sm bg-gradient-to-br from-gray-700 to-gray-800 border border-white/10 text-gray-300">
              {{ item.username ? item.username.charAt(0).toUpperCase() : '?' }}
           </div>

           <!-- Online Dot (Optional for groups or aggregate) -->
           <div v-if="item.isOnline" class="absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-[#1e293b] rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
        </div>
        
        <div class="flex-1 min-w-0">
           <div class="flex justify-between items-center mb-0.5">
             <div class="font-semibold text-white leading-tight truncate text-base flex items-center">
               <span v-if="item.isGroup" class="mr-1 text-indigo-400">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
               </span>
               {{ item.username }}
             </div>
             <!-- Unread Badge -->
             <div v-if="item.unreadCount > 0 && item.id !== selectedId" class="shrink-0 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-lg shadow-red-500/40 animate-pulse ml-2">
               {{ item.unreadCount }}
             </div>
           </div>
           
           <div class="text-xs truncate opacity-70" :class="item.isOnline ? 'text-emerald-400' : 'text-gray-400'">
             {{ item.isGroup ? `${item.members.length} members` : (item.isOnline ? 'Active Now' : 'Offline') }}
           </div>
        </div>
        
        <div v-if="selectedId === item.id" class="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-l-full"></div>
      </div>
    </div>
    
    <!-- Current User Profile (Footer) -->
    <div class="p-4 bg-black/20 border-t border-white/5 backdrop-blur-md">
       <div class="flex items-center space-x-3 mb-4">
          <div class="relative group cursor-pointer">
             <img 
               v-if="currentUser?.avatarUrl" 
               :src="currentUser.avatarUrl" 
               class="h-10 w-10 rounded-full object-cover border border-white/20"
             />
             <div v-else class="h-10 w-10 rounded-full bg-indigo-900/50 flex items-center justify-center text-indigo-200 font-bold border border-indigo-500/30">
               {{ currentUser?.username?.charAt(0).toUpperCase() }}
             </div>
             
             <!-- Upload Overlay -->
             <label class="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                 </svg>
                 <input type="file" class="hidden" @change="handleAvatarUpload" accept="image/*">
             </label>
          </div>
          <div class="flex-1 overflow-hidden">
             <p class="text-sm font-bold text-white truncate">{{ currentUser?.username }}</p>
             <p class="text-xs text-indigo-300">Online</p>
          </div>
       </div>

      <button @click="$emit('logout')" class="flex items-center justify-center w-full px-4 py-2 text-sm font-semibold text-red-300 hover:text-red-200 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-all border border-red-500/10">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Sign Out
      </button>
    </div>
  </div>
</template>
