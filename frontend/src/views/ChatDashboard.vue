<template>
  <div class="flex h-screen overflow-hidden bg-gray-50 font-sans">
    <!-- Sidebar -->
    <div class="w-80 bg-white shadow-2xl z-20 flex flex-col">
      <UserList 
        :friends="friends"
        :selectedUserId="selectedUser?.id" 
        @select="onUserSelect" 
        @logout="onLogout"
        @open-add-friend="showAddFriendModal = true"
      />
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col relative bg-gray-50">
       <!-- Top Bar with Notifications -->
       <div class="absolute top-4 right-4 z-30">
          <Notifications @friend-added="fetchFriends" />
       </div>

       <!-- Chat Area -->
       <div class="flex-1 overflow-hidden relative flex flex-col">
          <ChatWindow 
            :conversationId="activeConversationId" 
            :recipient="selectedUser"
            class="h-full border-l border-gray-200"
          />
       </div>
    </div>

    <!-- Modals -->
    <AddFriendModal 
      v-if="showAddFriendModal" 
      @close="showAddFriendModal = false" 
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import UserList from '../components/UserList.vue'
import ChatWindow from '../components/ChatWindow.vue'
import AddFriendModal from '../components/AddFriendModal.vue'
import Notifications from '../components/Notifications.vue'

const router = useRouter()
const selectedUser = ref(null)
const activeConversationId = ref(null)
const showAddFriendModal = ref(false)
const friends = ref([])

const fetchFriends = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get('http://localhost:3000/api/friends', {
      headers: { Authorization: `Bearer ${token}` }
    })
    friends.value = response.data
  } catch (error) {
    console.error('Failed to fetch friends', error)
  }
}

const onUserSelect = async (user) => {
  selectedUser.value = user
  activeConversationId.value = null 
  
  try {
    const token = localStorage.getItem('token')
    const response = await axios.post('http://localhost:3000/api/chat', {
        recipientId: user.id
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    activeConversationId.value = response.data.id
  } catch (error) {
    console.error('Failed to start conversation', error)
  }
}

const onLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}

onMounted(() => {
  fetchFriends()
})
</script>


