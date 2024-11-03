// config/webpack.base.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WebpackBar = require('webpackbar'); 
const { ProvidePlugin, DefinePlugin  } = require('webpack');

module.exports = {
  entry: path.resolve(__dirname, '../src/index.js'),
  output: {
    path: path.resolve(__dirname, '../dist'), // 打包后的文件存放的位置, 必须是绝对路径
    filename: 'js/[name].[chunkhash:8].js', // [name]格式化字符串，之前是啥名，现在还是啥名  2.[chunkhash:8]指定hash值,解决缓存问题
    clean: true, // 每次打包前清空dist目录
    publicPath: '/',  // 资源引用路径，若不配置，刷新页面，页面空白 如:/goods/detail ->/goods/js/main.js,找不到资源
  },
  resolve: {
    extensions: ['.js', '.tsx', '.ts', '.json'],  // 解析模块时，可以省略的扩展名
    alias: {
      '@': path.resolve(__dirname, '../', 'src'),
    },
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx|js|jsx)$/, use: ['babel-loader'],
      },
      {
        test: /.css$/,
        use: ['style-loader', 
            {loader: 'css-loader', options: { sourceMap: true }} // 如果要开启css的sourcemap可以这样设置
        ] // cssloader需要css 和 style 两个loader。style-loader必须放在前面
      },
      {
          test: /.less$/,
          use: ['style-loader', 'css-loader', 'less-loader']
      },
      {
          test: /.(png|jpg|jpeg|gif)$/,
          type: 'asset',
          generator: {
            filename: 'images/[hash][ext][query]'
          },
          parser: {
            dataUrlCondition: {
              maxSize: 4 * 1024 // 4kb
            }
          }
      },
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, '../', 'public/index.html'), // 指定template后div里的东西不会被删除
      inject: true, // 自动注入静态资源, 2可指定js插入位置，如body前
      title: '天使二次元', // 设置页面title
      // favicon: path.resolve(__dirname, '../', 'public/favicon.ico'), // 设置页面图标
      // filename: 'aaa.html', // 打包后的文件名, 默认index.html
    }),
    new WebpackBar({
      color: "#85d", // 默认green，进度条颜色支持HEX
      basic: false, // 默认true，启用一个简单的日志报告器
      profile: false, // 默认false，启用探查器。
    }),
    new ProvidePlugin({
      React: path.resolve(__dirname, '../', 'node_modules/react/index.js'),
    }),
    new DefinePlugin({ 
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV) 
    }),
  ],
  devServer: {
    open: true, // 自动打开浏览器
    port: 3000,
    compress: false, // gzip压缩,开发环境不开启，提升热更新速度
    static: {
      directory: path.join(__dirname, "../public"), //托管静态资源public文件夹
    },
    proxy: [{
      context: ['/commit/api'],
      target: 'http://127.0.0.1:3001',
      changeOrigin: true, // 是否跨域，虚拟的站点需要更管origin
      // 其他代理选项...
    }]
  },
  cache: {
    type: 'filesystem', // 使用文件缓存
  },
}
