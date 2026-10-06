import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import AppLayout from '../layouts/AppLayout.vue'
import AttendanceView from '../views/AttendanceView.vue'
import LoginView from '../views/LoginView.vue'
import ProfileView from '../views/ProfileView.vue'
import RequestsView from '../views/RequestsView.vue'
import TodosView from '../views/TodosView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'login', component: LoginView, meta: { guest: true } },
    {
      path: '/',
      component: AppLayout,
      redirect: '/todos',
      children: [
        { path: 'today', redirect: { name: 'todos' } },
        { path: 'attendance', name: 'attendance', component: AttendanceView },
        { path: 'requests', name: 'requests', component: RequestsView },
        { path: 'todos', name: 'todos', component: TodosView },
        { path: 'profile', name: 'profile', component: ProfileView },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (!to.meta.guest && !auth.isAuthenticated) return { name: 'login' }
  if (to.meta.guest && auth.isAuthenticated) return { name: 'todos' }
})

export default router
