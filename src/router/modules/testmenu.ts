// 最简代码，也就是这些字段必须有
export default {
  path: "/testmenu",
  meta: {
    title: "加油"
  },
  children: [
    {
      path: "/testmenu/index",
      name: "Fighting",
      component: () => import("@/views/testmenu/index.vue"),
      meta: {
        title: "testmenu",
        showLink: false
      }
    }
  ]
};
