import Vue from 'vue';
import VueRouter from 'vue-router';
import AirLine3DMap from '../views/3DAirLineMap.vue';

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'home',
    component: AirLine3DMap,
  },
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
});

export default router;
