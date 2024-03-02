// 最简代码，也就是这些字段必须有
export default {
  path: "/mapsystem",
  redirect: "/mapsystem/mapview",
  meta: {
    icon: "mdi:earth",
    title: "地图主页",
  },
  children: [
    {
      path: "/mapsystem/mapview",
      name: "mapsystem",
      component: () => import("@/views/mapsystem/MapView.vue"),
      meta: {
        title: "MapSystem"
      }
    }
  ]
};
