const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { clean } = require('semver');

module.exports = {
  entry: './src/index.js', // 项目的入口文件
  output: {
    filename: 'bundle.js', // 打包后的文件名
    path: path.resolve(__dirname, 'dist'), // 打包后的目录
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/, // 正则表达式，匹配.js或.jsx文件
        exclude: /node_modules/, // 排除node_modules目录
        use: {
          loader: 'babel-loader', // 使用babel-loader
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'], // Babel预设
          },
        },
      },
      {
        test: /\.css$/, // 正则表达式，匹配.css文件
        use: ['style-loader', 'css-loader'], // 使用style-loader和css-loader
      },
      {
        test: /\.less$/,
        use: [
          'style-loader', // 将 JS 字符串生成为 style 节点
          'css-loader',   // 将 CSS 转化成 CommonJS 模块
          'less-loader'   // 将 Less 编译成 CSS
        ]
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'images/[hash][ext][query]'
        }
      },
    ],
  },
  plugins: [   
    // Html-webpack-plugin配置
    new HtmlWebpackPlugin({
        template: path.resolve(__dirname, './index.html'),
        inject: true
    }),
    new CleanWebpackPlugin(), //实例化clean-webpack-plugin插件，删除上次打包的文件
  ],
  // 开发工具
  devtool: 'source-map',
  // 开发服务器
  devServer: {
    static: './dist',
    port: 3000,
    open: true,
  },
};