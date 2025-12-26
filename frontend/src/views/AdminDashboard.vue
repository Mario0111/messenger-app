<template>
    <div class="min-h-screen bg-gray-900 text-white p-6">
        <header class="flex justify-between items-center mb-8">
            <h1 class="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Admin Dashboard
            </h1>
            <button @click="logout"
                class="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition duration-200">
                Logout
            </button>
        </header>

        <main>
            <div class="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-semibold">User Management</h2>
                    <button @click="showCreateUserModal = true"
                        class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition duration-200 flex items-center gap-2">
                        <span>+</span> Create User
                    </button>
                </div>

                <!-- World Map -->
                <div class="mb-8 rounded-xl overflow-hidden shadow-lg border border-gray-700 relative h-[400px] bg-gray-900 z-0" id="map"></div>

                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="border-b border-gray-700 text-gray-400">
                                <th class="p-4">Username</th>
                                <th class="p-4">Role</th>
                                <th class="p-4">Joined At</th>
                                <th class="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="user in users" :key="user.id" class="border-b border-gray-700 hover:bg-gray-750">
                                <td class="p-4 font-medium">{{ user.username }}</td>
                                <td class="p-4">
                                    <span :class="{
                                        'px-2 py-1 rounded-full text-xs font-semibold': true,
                                        'bg-purple-500/20 text-purple-400': user.role === 'admin',
                                        'bg-green-500/20 text-green-400': user.role === 'user'
                                    }">
                                        {{ user.role }}
                                    </span>
                                </td>
                                <td class="p-4 text-gray-400">{{ formatDate(user.createdAt) }}</td>
                                <td class="p-4">
                                    <button v-if="user.role !== 'admin'" @click="deleteUser(user.id)"
                                        class="text-red-400 hover:text-red-300 transition duration-200">
                                        Delete
                                    </button>
                                </td>
                            </tr>
                            <tr v-if="users.length === 0">
                                <td colspan="4" class="p-8 text-center text-gray-500">No users found.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </main>

        <!-- Create User Modal -->
        <div v-if="showCreateUserModal" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
            <div class="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
                <h3 class="text-xl font-bold mb-4">Create New User</h3>
                <form @submit.prevent="createUser" class="space-y-4">
                    <div>
                        <label class="block text-sm text-gray-400 mb-1">Username</label>
                        <input v-model="newUser.username" type="text" required
                            class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm text-gray-400 mb-1">Password</label>
                        <input v-model="newUser.password" type="password" required
                            class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500">
                    </div>
                    <div class="flex justify-end gap-3 mt-6">
                        <button type="button" @click="showCreateUserModal = false"
                            class="px-4 py-2 text-gray-400 hover:text-white transition">Cancel</button>
                        <button type="submit"
                            class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition duration-200">
                            Create
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow
});

const router = useRouter();
const users = ref([]);
const showCreateUserModal = ref(false);
const newUser = ref({ username: '', password: '' });
let map = null;
let markersLayer = null;
let pollInterval = null;

const token = sessionStorage.getItem('token');

const initMap = () => {
    if (map) return;
    map = L.map('map').setView([20, 0], 2);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    markersLayer = L.layerGroup().addTo(map);
};

const updateMap = () => {
    if (!map) initMap();
    
    // Clear old markers to avoid duplicates on poll
    markersLayer.clearLayers();
    
    users.value.forEach(user => {
        if (user.lat && user.lng) {
            // Apply DETERMINISTIC Jitter based on User ID
            // This ensures they don't move on refresh, but still don't overlap if identical
            // Simple hash of the ID string to get a number between -1 and 1
            const hash = user.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const pseudoRandom1 = Math.sin(hash) * 10000;
            const pseudoRandom2 = Math.cos(hash) * 10000;
            const offset1 = (pseudoRandom1 - Math.floor(pseudoRandom1) - 0.5) * 0.01;
            const offset2 = (pseudoRandom2 - Math.floor(pseudoRandom2) - 0.5) * 0.01;

            L.marker([user.lat + offset1, user.lng + offset2])
                .addTo(markersLayer)
                .bindPopup(`<b>${user.username}</b><br>${user.country || 'Unknown'}`);
        }
    });
}

const fetchUsers = async () => {
    try {
        const res = await fetch('http://localhost:3000/api/users/admin/all', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            users.value = await res.json();
            // Wait for DOM or just update if map exists
             // Only delay init if map not created
            if (!map) setTimeout(updateMap, 100);
            else updateMap();
        } else {
            console.error('Failed to fetch users');
        }
    } catch (e) {
        console.error(e);
    }
};

onMounted(() => {
    fetchUsers();
    pollInterval = setInterval(fetchUsers, 5000); // Poll every 5s
});

onUnmounted(() => {
    if (pollInterval) clearInterval(pollInterval);
});

const deleteUser = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
        const res = await fetch(`http://localhost:3000/api/users/admin/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            users.value = users.value.filter(u => u.id !== id);
        } else {
            alert('Failed to delete user');
        }
    } catch (e) {
        alert('Error deleting user');
    }
};

const createUser = async () => {
    try {
        const res = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUser.value)
        });
        if (res.ok) {
            showCreateUserModal.value = false;
            newUser.value = { username: '', password: '' };
            fetchUsers();
            alert('User created successfully');
        } else {
            const data = await res.json();
            alert(data.error || 'Failed to create user');
        }
    } catch (e) {
        alert('Error creating user');
    }
};

const logout = () => {
    sessionStorage.clear();
    router.push('/login');
};

const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString();
};


</script>
