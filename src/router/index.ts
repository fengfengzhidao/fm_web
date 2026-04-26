import {createRouter, createWebHistory} from 'vue-router'
import NProgress from "nprogress";
import {userStorei} from "@/stores/user_store";
import {Message} from "@arco-design/web-vue"; // 导入 nprogress模块


const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            name: "web",
            path: "/",
            component: () => import("@/views/web/index.vue"),
            // redirect: "/admin",
            children: [
                {
                    name: "web_home",
                    path: "",
                    component: () => import("@/views/web/web_home.vue"),
                },
                {
                    name: "web_search",
                    path: "search",
                    component: () => import("@/views/web/web_search.vue"),
                },
                {
                    name: "web_sec_kill",
                    path: "sec_kill",
                    component: () => import("@/views/web/sec_kill.vue"),
                    meta: {
                        title: "秒杀专区",
                    }
                },
                {
                    name: "web_goods_detail",
                    path: "goods/:id",
                    component: () => import("@/views/web/goods_detail.vue"),
                },
                {
                    name: "web_cart",
                    path: "cart",
                    component: () => import("@/views/web/cart.vue"),
                    meta: {
                        title: "购物车",
                    }
                },
                {
                    name: "web_checkout",
                    path: "checkout",
                    component: () => import("@/views/web/checkout.vue"),
                    meta: {
                        auth: true,
                        title: "确认订单",
                    }
                },
                {
                    name: "web_order_pay",
                    path: "order/pay",
                    component: () => import("@/views/web/order_pay.vue"),
                    meta: {
                        auth: true,
                        title: "订单支付",
                    }
                },
                {
                    name: "web_user_center",
                    path: "user_center",
                    component: () => import("@/views/web/user_center/index.vue"),
                    meta: {
                        auth: true,
                        title: "用户中心",
                    },
                    redirect: {name: "web_user_center_info"},
                    children: [
                        {
                            name: "web_user_center_info",
                            path: "info",
                            component: () => import("@/views/web/user_center/info.vue"),
                            meta: {
                                auth: true,
                                title: "个人中心",
                            }
                        },
                        {
                            name: "web_user_center_order",
                            path: "order",
                            component: () => import("@/views/web/user_center/order.vue"),
                            meta: {
                                auth: true,
                                title: "我的订单",
                            }
                        },
                        {
                            name: "web_user_center_order_detail",
                            path: "order/:id",
                            component: () => import("@/views/web/user_center/order_detail.vue"),
                            meta: {
                                auth: true,
                                title: "订单详情",
                            }
                        },
                        {
                            name: "web_user_center_collect",
                            path: "collect",
                            component: () => import("@/views/web/user_center/collect.vue"),
                            meta: {
                                auth: true,
                                title: "我的收藏",
                            }
                        },
                        {
                            name: "web_user_center_look",
                            path: "look",
                            component: () => import("@/views/web/user_center/look.vue"),
                            meta: {
                                auth: true,
                                title: "我的足迹",
                            }
                        },
                        {
                            name: "web_user_center_addr",
                            path: "addr",
                            component: () => import("@/views/web/user_center/addr.vue"),
                            meta: {
                                auth: true,
                                title: "我的地址",
                            }
                        },
                        {
                            name: "web_user_center_coupon",
                            path: "coupon",
                            component: () => import("@/views/web/user_center/coupon.vue"),
                            meta: {
                                auth: true,
                                title: "我的优惠券",
                            }
                        },
                        {
                            name: "web_user_center_msg",
                            path: "msg",
                            component: () => import("@/views/web/user_center/msg.vue"),
                            meta: {
                                auth: true,
                                title: "消息通知",
                            }
                        },
                        {
                            name: "web_user_center_comment",
                            path: "comment",
                            component: () => import("@/views/web/user_center/comment.vue"),
                            meta: {
                                auth: true,
                                title: "我的评价",
                            }
                        }
                    ]
                }
            ]
        },
        {
            name: "login",
            path: "/login",
            component: () => import("@/views/login/index.vue")
        },
        {
            name: "admin",
            path: "/admin",
            component: () => import("@/views/admin/index.vue"),
            meta: {
                title: "首页",
                role: [1, 2, 3]
            },
            children: [
                {
                    name: "home",
                    path: "",
                    component: () => import("@/views/admin/home/index.vue"),
                    meta: {
                        title: "数据统计",
                    }
                },
                {
                    name: "userCenter",
                    path: "user_center",
                    meta: {
                        title: "个人中心",
                    },
                    children: [
                        {
                            name: "userInfo",
                            path: "user_info",
                            meta: {
                                title: "个人信息"
                            },
                            component: () => import("@/views/admin/user_center/index.vue"),
                        }
                    ]
                },
                {
                    name: "userManage",
                    path: "user_manage",
                    meta: {
                        title: "用户管理",
                        role: [1]
                    },
                    children: [
                        {
                            name: "userList",
                            path: "user_list",
                            meta: {
                                title: "用户列表"
                            },
                            component: () => import("@/views/admin/user_manage/index.vue"),
                        }
                    ]
                },
                {
                    name: "dataManage",
                    path: "data_manage",
                    meta: {
                        title: "数据统计",
                        role: [1]
                    },
                    children: [
                        {
                            name: "dataStatistics",
                            path: "statistics",
                            meta: {
                                title: "统计概览"
                            },
                            component: () => import("@/views/admin/home/index.vue"),
                        }
                    ]
                },
                {
                    name: "goodsManage",
                    path: "goods_manage",
                    meta: {
                        title: "商品管理",
                        role: [1]
                    },
                    children: [
                        {
                            name: "goodsList",
                            path: "goods_list",
                            meta: {
                                title: "商品列表"
                            },
                            component: () => import("@/views/admin/goods_manage/index.vue"),
                        },
                        {
                            name: "goodsCreate",
                            path: "create",
                            meta: {
                                title: "发布商品"
                            },
                            component: () => import("@/views/admin/goods_manage/goods_form_page.vue"),
                        },
                        {
                            name: "goodsEdit",
                            path: "edit/:id",
                            meta: {
                                title: "编辑商品"
                            },
                            component: () => import("@/views/admin/goods_manage/goods_form_page.vue"),
                        },
                        {
                            name: "orderList",
                            path: "order_list",
                            meta: {
                                title: "订单管理"
                            },
                            component: () => import("@/views/admin/order_manage/index.vue"),
                        }
                    ]
                },
                {
                    name: "commentManage",
                    path: "comment_manage",
                    meta: {
                        title: "评价管理",
                        role: [1]
                    },
                    children: [
                        {
                            name: "commentList",
                            path: "comment_list",
                            meta: {
                                title: "评价列表"
                            },
                            component: () => import("@/views/admin/comment_manage/index.vue"),
                        }
                    ]
                },
                {
                    name: "activityManage",
                    path: "activity_manage",
                    meta: {
                        title: "活动管理",
                        role: [1]
                    },
                    children: [
                        {
                            name: "activityList",
                            path: "activity_list",
                            meta: {
                                title: "活动列表"
                            },
                            component: () => import("@/views/admin/activity_manage/index.vue"),
                        }
                    ]
                },
                {
                    name: "settingsManage",
                    path: "settings_manage",
                    meta: {
                        title: "站点配置",
                        role: [1]
                    },
                    children: [
                        {
                            name: "settings",
                            path: "settings",
                            meta: {
                                title: "基础配置"
                            },
                            component: () => import("@/views/admin/settings_manage/index.vue"),
                        }
                    ]
                }
            ]
        },
        {
            name: "notfound",
            path: "/:match(.*)",
            component: () => import("@/views/web/404.vue"),
        }
    ]
})

router.beforeEach((to, from, next) => {
    if (to.meta.auth || to.meta.role) {
        // 判断当前用户的角色，在不在列表里面
        const store = userStorei()
        console.log(store.userInfo)
        if (!store.isLogin) {
            // 没有登陆
            Message.warning("需要登陆")
            store.openLoginModal(to.fullPath)
            next(false)
            return
        }

        if (to.meta.role && !to.meta.role.includes(store.userInfo.role)) {
            // 不在
            Message.warning("鉴权失败")
            router.push(from.path)
            return
        }
    }
    NProgress.start();//开启进度条
    next()
})
//当路由进入后：关闭进度条
router.afterEach(() => {
    // 在即将进入新的页面组件前，关闭掉进度条
    NProgress.done()//完成进度条
})

export default router
