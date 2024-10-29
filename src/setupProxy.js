const {createProxyMiddleware: proxy} = require('http-proxy-middleware');

module.exports = function(app) {
    app.use(
        proxy("/commit/api/**", {
            pathRewrite: {
                '^/commit/api': '/commit/api'
            },
            // target: 'http://8.152.1.135:3001',
            target: 'http://127.0.0.1:3001',
            changeOrigin: true,
        })
    )
}