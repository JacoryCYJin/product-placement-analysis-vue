import {createRouter, createWebHistory} from "vue-router";

export default createRouter({
  // 路由器模式选择
  history: createWebHistory(),
  // 管理路由
  routes: [
	{
	  path: "/home",
	  component: () => import("@/views/home/Home.vue"),
	},
	// {
	//   path: "/function2",
	//   component: () => import("@/views/function2/Index.vue")
	// },
	{
	  path: "/",
	  redirect: "/home",
	},
  ],
  //滚动行为：控制滚动条的位置
  scrollBehavior() {
	return {
	  left: 0,
	  top: 0,
	};
  },
});