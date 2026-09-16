import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Chat from '../views/Chat.vue'
import Profile from '../views/Profile.vue'
import Detail from '../views/Detail.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
  },
  {
    path:'/chat',
    name:'chat',
    component: Chat,
  },
  {
    path:'/profile',
    name:'profile',
    component: Profile,
  },
  {
    path:'/detail',
    name:'Detail',
    component: Detail,
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
