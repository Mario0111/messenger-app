<template>
  <div class="h-full flex flex-col bg-white border-r border-gray-100 shadow-xl z-20">
    <!-- Header -->
    <div class="p-6 bg-gradient-to-r from-indigo-600 to-purple-600">
      <h2 class="text-2xl font-bold text-white tracking-wide">Messenger</h2>
      <p class="text-indigo-100 text-sm mt-1 opacity-90">Connect with friends</p>
    </div>
    
    <!-- Action Bar -->
    <div class="p-4 border-b border-gray-100">
      <button 
        @click="$emit('open-add-friend')"
        class="w-full py-3 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-sm hover:shadow-md"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Add New Friend</span>
      </button>
    </div>
    
    <!-- List -->
    <div class="flex-1 overflow-y-auto p-4 space-y-2">
      <div v-if="friends.length === 0" class="text-center py-10">
         <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
         </div>
         <p class="text-gray-500 font-medium">No friends yet.</p>
         <p class="text-gray-400 text-sm">Click the button above to start.</p>
      </div>

      <div 
        v-for="friend in friends" 
        :key="friend.id"
        @click="$emit('select', friend)"
        class="group p-3 rounded-xl cursor-pointer transition-all duration-200 border border-transparent hover:border-indigo-100 hover:shadow-md flex items-center space-x-4"
        :class="selectedUserId === friend.id ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-200 transform scale-[1.02]' : 'bg-white hover:bg-gray-50 text-gray-700'"
      >
        <div class="relative">
           <div class="h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold shadow-sm"
             :class="selectedUserId === friend.id ? 'bg-white text-indigo-600' : 'bg-indigo-100 text-indigo-600 group-hover:bg-white'">
              {{ friend.username.charAt(0).toUpperCase() }}
           </div>
           <div class="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
        </div>
        
        <div class="flex-1 min-w-0">
           <div class="font-semibold text-lg leading-tight truncate">
             {{ friend.username }}
           </div>
           <div class="text-xs mt-0.5 truncate opacity-80" :class="selectedUserId === friend.id ? 'text-indigo-100' : 'text-gray-400'">
             Tap to chat
           </div>
        </div>
        
        <div v-if="selectedUserId === friend.id" class="text-white opacity-80">
           <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
           </svg>
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="p-4 border-t border-gray-100 bg-gray-50">
      <button @click="$emit('logout')" class="flex items-center justify-center w-full px-4 py-3 text-sm font-semibold text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Sign Out
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps(['friends', 'selectedUserId'])
const emit = defineEmits(['select', 'logout', 'open-add-friend'])
</script>
