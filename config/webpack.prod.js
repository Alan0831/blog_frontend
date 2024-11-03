const path = require('path');
const { merge } = require('webpack-merge');
const base = require('./webpack.base.js');
const CopyPlugin = require('copy-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = merge(base, {
  mode: 'production', // 生产模式,会开启tree-shaking和压缩代码,以及其他优化
  plugins: [
    // 复制public文件夹
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, '../public'), // 复制public下文件
          to: path.resolve(__dirname, '../dist/images'), // 复制到dist目录中
          filter: source => {
            return !source.includes('index.html') // 忽略index.html
          }
        },
      ],
    }),
    new BundleAnalyzerPlugin(),
  ],
  optimization: {
    minimizer: [ 
      // 压缩css
      new CssMinimizerPlugin(),
      // 压缩js
      new TerserPlugin({
        parallel: true, // 开启多线程压缩
        terserOptions: {
          compress: {
            // pure_funcs: ["console.log"] // 删除console.log
          }
        }
      }),
    ],
    // 提取第三方包和公共模块
    splitChunks: { 
      chunks: 'all',
      minSize: 10, // 提取代码体积大于10就提取出来
      cacheGroups: {
        vendors: { // 提取node_modules代码
          name: 'vendors', // 名称.hash.js
          test: /[\\/]node_modules[\\/]/,  // 只匹配node_modules里面的模块
          minChunks: 1, // 只要使用一次就提取出来
          priority: -10, // 注意优先级,如果过高下边不生效
          reuseExistingChunk: true,
        },
        commons: { // 提取页面公共代码
          name: 'commons', // 提取文件命名为commons
          minChunks: 2, // 只要使用两次就提取出来
          priority: -20, // 注意优先级,如果过高下边不生效
          reuseExistingChunk: true,
        },
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)/,
          name: 'react',
          reuseExistingChunk: true,
        },
        antd: {
          name: 'antd',
          test: /[\\/]node_modules[\\/](antd)/,
          reuseExistingChunk: true,
        },
      }
    }, 
  },
})
