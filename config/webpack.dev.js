const path = require('path');
const { merge } = require('webpack-merge');
const base = require('./webpack.base.js');

module.exports = merge(base, {
  mode: 'development', // development:开发环境,内存打包  production:生产环境，硬盘打包
  devtool: 'eval-cheap-module-source-map', // 生成map文件，方便调试
});
