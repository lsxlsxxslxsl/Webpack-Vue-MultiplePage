var path = require('path');
var webpack = require('webpack');
// 将样式提取到单独的 css 文件中，而不是打包到 js 文件或使用 style 标签插入在 head 标签中
var ExtractTextPlugin = require('extract-text-webpack-plugin');
// 生成自动引用 js 文件的HTML
var HtmlWebpackPlugin = require('html-webpack-plugin');
var glob = require('glob');

var entries = getEntry('./source/**/*.js'); // 获得入口 js 文件
var chunks = Object.keys(entries);

module.exports = {
  entry: entries,
  output: {
    path: path.resolve(__dirname, 'Public'), // html, css, js 图片等资源文件的输出路径，将所有资源文件放在 Public 目录
    publicPath: '/Public/',                  // html, css, js 图片等资源文件的 server 上的路径
    filename: 'js/[name].[hash].js',         // 每个入口 js 文件的生成配置
    chunkFilename: 'js/[id].[hash].js'
  },
  resolve: {
    extensions: ['', '.js', '.vue']
  },
  module: {
    loaders: [
      {
        test: /\.css$/,
        // 使用提取 css 文件的插件，能帮我们提取 webpack 中引用的和 vue 组件中使用的样式
        loader: ExtractTextPlugin.extract('style', 'css')
      },
      {
        // vue-loader，加载 vue 组件
        test: /\.vue$/,
        loader: 'vue'
      },
      {
        test: /\.js$/,
        // 使用 es6 开发，这个加载器帮我们处理
        loader: 'babel',
        exclude: /node_modules/
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        // 图片加载器，较小的图片转成 base64
        loader: 'url',
        query: {
          limit: 10000,
          name: './imgs/[name].[ext]?[hash:7]'
        }
      }
    ]
  },
  babel: {
    presets: ['es2015'],
    plugins: ['transform-runtime']
  },
  vue: { // vue 的配置
    loaders: {
      js: 'babel',
      css: ExtractTextPlugin.extract('vue-style-loader', 'css-loader')
    }
  },
  plugins: [
    // 提取公共模块
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendors', // 公共模块的名称
      chunks: chunks,  // chunks 是需要提取的模块
      minChunks: chunks.length
    }),
    // 配置提取出的样式文件
    new ExtractTextPlugin('css/[name].css')
  ]
};

var prod = process.env.NODE_ENV === 'production';
module.exports.plugins = (module.exports.plugins || []);
if (prod) {
  module.exports.devtool = 'source-map';
  module.exports.plugins = module.exports.plugins.concat([
    // 借鉴 vue 官方的生成环境配置
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"'
      }
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    }),
    new webpack.optimize.OccurenceOrderPlugin()
  ]);
} else {
  module.exports.devtool = 'eval-source-map';
  module.exports.output.publicPath = '/View/';
}

var pages = getEntry('./source/**/*.html');
for (var pathname in pages) {
  // 配置生成的 html 文件，定义路径等
  var conf = {
    filename: prod? '../Application/Home/View/' + pathname + '.html' : pathname + '.html', // html 文件输出路径
    template: pages[pathname], // 模板路径
    inject: true,              // js 插入位置
    minify: {
      removeComments: true,
      collapseWhitespace: false
    }
  };
  if (pathname in module.exports.entry) {
    conf.chunks = ['vendors', pathname];
    conf.hash = false;
  }
  // 需要生成几个 html 文件，就配置几个 HtmlWebpackPlugin 对象
  module.exports.plugins.push(new HtmlWebpackPlugin(conf));
}

// 根据项目具体需求，输出正确的 js 和 html 路径
function getEntry(globPath) {
  var entries = {},
    basename, tmp, pathname;

  glob.sync(globPath).forEach(function (entry) {
    basename = path.basename(entry, path.extname(entry));
    tmp = entry.split('/').splice(-3);
    pathname = tmp.splice(0, 1) + '/' + basename; // 正确输出 js 和 html 的路径
    entries[pathname] = entry;
  });
  console.log(entries);
  return entries;
}