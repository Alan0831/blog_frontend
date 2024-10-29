// router index.js 
import { lazy } from 'react'
const routers = [
    {
        path: '/',
        name: '主页',
        components: lazy(() => import('../page/home/index'))
    },
    {
        path: '/login',
        name: '登录页',
        components: lazy(() => import('../page/login/index'))    // 引入pages文件下的页面
    },
    {
        path: '/writeArticle',
        name: '写文章',
        components: lazy(() => import('../page/writeArticle/index'))    // 引入pages文件下的页面
    },
    {
        path: '/article/:id',
        name: '文章详情',
        components: lazy(() => import('../page/article/index'))    // 引入pages文件下的页面
    },
    {
        path: '/help',
        name: '帮助中心',
        components: lazy(() => import('../page/help/index'))    // 引入pages文件下的页面
    },
    {
        path: '/three',
        name: 'three',
        components: lazy(() => import('../page/three/index7'))    // 引入pages文件下的页面
    },
]
 
export default routers;    // 将数组导出
