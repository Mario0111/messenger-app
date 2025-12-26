import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import ChatDashboard from '../views/ChatDashboard.vue'
import AdminDashboard from '../views/AdminDashboard.vue'

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: Login
    },
    {
        path: '/register',
        name: 'Register',
        component: Register
    },
    {
        path: '/',
        name: 'Chat',
        component: ChatDashboard,
        meta: { requiresAuth: true }
    },
    {
        path: '/admin',
        name: 'AdminDashboard',
        component: AdminDashboard,
        meta: { requiresAuth: true, requiresAdmin: true }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to, from, next) => {
    const isAuthenticated = sessionStorage.getItem('token')
    const userRole = sessionStorage.getItem('role')

    if (to.meta.requiresAuth && !isAuthenticated) {
        next('/login')
    } else if (to.meta.requiresAdmin && userRole !== 'admin') {
        next('/')
    } else if ((to.name === 'Login' || to.name === 'Register') && isAuthenticated) {
        if (userRole === 'admin') {
            next('/admin')
        } else {
            next('/')
        }
    } else {
        next()
    }
})

export default router
