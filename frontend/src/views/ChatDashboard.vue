<template>
  <div class="flex h-screen overflow-hidden bg-[#0f172a] font-sans relative">
    <!-- Background Ambience -->
    <div class="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/40 rounded-full mix-blend-screen filter blur-[128px] opacity-30 animate-pulse"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/40 rounded-full mix-blend-screen filter blur-[128px] opacity-30 animate-pulse animation-delay-2000"></div>

    <!-- Sidebar -->
    <div class="w-80 bg-white/5 backdrop-blur-2xl border-r border-white/5 z-20 flex flex-col relative shadow-[0_0_40px_rgba(0,0,0,0.2)]">
      <UserList 
        :items="conversations"
        :currentUser="currentUser"
        :selectedId="activeConversationId" 
        @select="onConversationSelect" 
        @logout="onLogout"
        @open-add-friend="showAddFriendModal = true"
        @open-create-group="showCreateGroupModal = true"
        @refresh="fetchData"
        @upload-avatar="fetchProfile"
        @open-settings="showSettingsModal = true"
      />
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col relative z-10 bg-black/20 backdrop-blur-sm">
       <!-- Top Bar with Notifications -->
       <div class="absolute top-6 right-6 z-30">
          <Notifications @friend-added="fetchData" />
       </div>

       <!-- Chat Area -->
       <div class="flex-1 overflow-hidden relative flex flex-col">
          <ChatWindow 
            :conversationId="activeConversationId" 
            :recipient="selectedRecipient"
            class="h-full"
            @message-sent="fetchData" 
          />
       </div>
    </div>

    <!-- Modals -->
    <AddFriendModal 
      v-if="showAddFriendModal" 
      @close="showAddFriendModal = false" 
    />
    <CreateGroupModal
      v-if="showCreateGroupModal"
      :friends="friends"
      @close="showCreateGroupModal = false"
      @group-created="fetchData"
    />
    <SettingsModal
      v-if="showSettingsModal"
      @close="showSettingsModal = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import UserList from '../components/UserList.vue'
import ChatWindow from '../components/ChatWindow.vue'
import AddFriendModal from '../components/AddFriendModal.vue'
import CreateGroupModal from '../components/CreateGroupModal.vue'
import Notifications from '../components/Notifications.vue'
import SettingsModal from '../components/SettingsModal.vue'

const router = useRouter()
const activeConversationId = ref(null)
const selectedRecipient = ref(null)

const showAddFriendModal = ref(false)
const showCreateGroupModal = ref(false)
const showSettingsModal = ref(false)

const conversations = ref([]) // DMs and Groups
const friends = ref([]) // For selecting in modal
const currentUser = ref({})
let pollInterval

const fetchData = async () => {
    await Promise.all([fetchConversations(), fetchFriends(), fetchProfile()])
}

const fetchConversations = async () => {
  try {
    const token = sessionStorage.getItem('token')
    if (!token) return
    const response = await axios.get('http://localhost:3000/api/chat', {
      headers: { Authorization: `Bearer ${token}` }
    })
    conversations.value = response.data
  } catch (error) {
    console.error('Failed to fetch conversations', error)
  }
}

const fetchFriends = async () => {
  try {
    const token = sessionStorage.getItem('token')
    if (!token) return
    const response = await axios.get('http://localhost:3000/api/friends', {
      headers: { Authorization: `Bearer ${token}` }
    })
    friends.value = response.data
  } catch (error) {
    console.error('Failed to fetch friends', error)
  }
}

const fetchProfile = async () => {
    try {
        const token = sessionStorage.getItem('token')
        if(!token) return
        const response = await axios.get('http://localhost:3000/api/users/me', {
             headers: { Authorization: `Bearer ${token}` }
        })
        currentUser.value = response.data
    } catch (e) { console.error(e) }
}

const onConversationSelect = async (item) => {
  activeConversationId.value = item.id
  
  // Optimistically clear unread
  const conv = conversations.value.find(c => c.id === item.id)
  if (conv) conv.unreadCount = 0

  // For the ChatWindow header, we need to construct a "recipient" object
  // If it's a group, we fake a recipient with component details
  if (item.isGroup) {
      selectedRecipient.value = {
          username: item.username, // Holds title
          avatarUrl: null, // Groups have no avatar yet
          isOnline: true // Always show groups as active?
      }
  } else {
      // It's a DM, item has all we need
      selectedRecipient.value = {
          username: item.username,
          avatarUrl: item.avatarUrl,
          isOnline: item.isOnline,
          id: item.otherUserId
      }
  }
}

const onLogout = async () => {
  try {
     const token = sessionStorage.getItem('token')
     await axios.post('http://localhost:3000/api/auth/logout', {}, {
         headers: { Authorization: `Bearer ${token}` }
     })
  } catch (e) { /* ignore */ }
  
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('user')
  router.push('/login')
}

onMounted(() => {
  const token = sessionStorage.getItem('token')
  if (!token) {
      router.push('/login')
      return
  }
  fetchData()
  // Poll for updates every 5 seconds
  pollInterval = setInterval(fetchData, 5000)
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
})
</script>


