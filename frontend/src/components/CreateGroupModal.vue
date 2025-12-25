<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
    <div class="bg-gray-900 border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
      
      <!-- Header -->
      <div class="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
        <h3 class="text-xl font-bold text-white">Create New Group</h3>
        <button @click="$emit('close')" class="text-gray-400 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="p-6 space-y-6">
        <!-- Group Name -->
        <div>
            <label class="block text-sm font-medium text-gray-400 mb-2">Group Name</label>
            <input 
                v-model="groupName" 
                type="text" 
                placeholder="e.g., The Avengers"
                class="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
        </div>

        <!-- Member Selection -->
        <div>
            <label class="block text-sm font-medium text-gray-400 mb-2">Select Members</label>
            <div class="max-h-48 overflow-y-auto custom-scrollbar space-y-2 border border-white/5 rounded-xl p-2 bg-black/20">
                <div 
                    v-for="friend in friends" 
                    :key="friend.id"
                    @click="toggleMember(friend.id)"
                    class="flex items-center p-2 rounded-lg cursor-pointer transition-colors"
                    :class="selectedMembers.includes(friend.id) ? 'bg-indigo-600/20 border border-indigo-500/50' : 'hover:bg-white/5 border border-transparent'"
                >
                    <div class="relative mr-3">
                        <img 
                            v-if="friend.avatarUrl" 
                            :src="friend.avatarUrl" 
                            class="h-8 w-8 rounded-full object-cover"
                        />
                        <div v-else class="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-white">
                            {{ friend.username.charAt(0).toUpperCase() }}
                        </div>
                         <!-- Checkmark -->
                        <div v-if="selectedMembers.includes(friend.id)" class="absolute -top-1 -right-1 bg-indigo-500 rounded-full p-0.5">
                             <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                            </svg>
                        </div>
                    </div>
                    <span class="text-gray-200 font-medium">{{ friend.username }}</span>
                </div>
            </div>
            <p class="text-xs text-gray-500 mt-2">{{ selectedMembers.length }} selected</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-6 border-t border-white/5 bg-black/20 flex justify-end">
        <button 
            @click="createGroup" 
            :disabled="!groupName.trim() || selectedMembers.length === 0"
            class="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/50 transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
            Create Group
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const props = defineProps(['friends'])
const emit = defineEmits(['close', 'group-created'])

const groupName = ref('')
const selectedMembers = ref([])

const toggleMember = (id) => {
    if (selectedMembers.value.includes(id)) {
        selectedMembers.value = selectedMembers.value.filter(m => m !== id)
    } else {
        selectedMembers.value.push(id)
    }
}

const createGroup = async () => {
    if (!groupName.value.trim() || selectedMembers.value.length === 0) return

    try {
        const token = sessionStorage.getItem('token')
        await axios.post('http://localhost:3000/api/chat/group', {
            title: groupName.value,
            memberIds: selectedMembers.value
        }, {
            headers: { Authorization: `Bearer ${token}` }
        })
        
        emit('group-created')
        emit('close')
    } catch (error) {
        console.error("Failed to create group", error)
    }
}
</script>
