const path = require('path');
const { merge } = require('webpack-merge')
const base = require('./webpack.base.js')

module.exports = merge(base, {
  mode: 'production', // 生产模式,会开启tree-shaking和压缩代码,以及其他优化
})
