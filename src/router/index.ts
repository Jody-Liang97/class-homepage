import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView, meta: { title: '首页' } },
  {
    path: '/resources',
    name: 'resources',
    component: () => import('../views/ResourcesView.vue'),
    meta: { title: '学习资料' },
  },
  {
    path: '/affairs',
    name: 'affairs',
    component: () => import('../views/AffairsView.vue'),
    meta: { title: '班级事务' },
  },
  {
    path: '/memories',
    name: 'memories',
    component: () => import('../views/MemoriesView.vue'),
    meta: { title: '班级回忆' },
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('../views/AboutView.vue'),
    meta: { title: '关于班级' },
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0, behavior: 'smooth' }),
})

router.afterEach((to) => {
  document.title = `${String(to.meta.title ?? '班级主页')} · 拾光`
})

export default router

