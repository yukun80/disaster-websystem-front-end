// 不可修改
const { VITE_HIDE_HOME } = import.meta.env; // VITE_HIDE_HOME用于控制首页链接是否显示
const Layout = () => import("@/layout/index.vue");

export default {
  path: "/",
  name: "Home",
  component: Layout,
  redirect: "/Map-System",
  meta: {
    // icon: "homeFilled",
    icon: "mdi:earth",
    title: "首页",
    rank: 0
  },
  children: [
    {
      path: "/Map-System",
      name: "灾害管理系统",
      component: () => import("@/views/Map-System/index.vue"),
      meta: {
        title: "地图主页",
        showLink: VITE_HIDE_HOME === "true" ? false : true
      }
    }
  ]
} as RouteConfigsTable;
