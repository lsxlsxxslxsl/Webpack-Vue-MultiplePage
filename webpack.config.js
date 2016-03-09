var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var glob = require('glob');

var entries = getEntry('./source/**/*.js');
var chunks = Object.keys(entries);

module.exports = {
  entry: entries,
  output: {
    path: path.resolve(__dirname, 'Public'),
    publicPath: '/Public/',
    filename: 'js/[name].[hash].js',
    chunkFilename: 'js/[id].[hash].js'
  },
  resolve: {
    extensions: ['', '.js', '.vue']
  },
  module: {
    loaders: [
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract('style', 'css')
      },
      {
        test: /\.vue$/,
        loader: 'vue'
      },
      {
        test: /\.js$/,
        loader: 'babel',
        exclude: /node_modules/
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
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
  vue: {
    loaders: {
      js: 'babel',
      css: ExtractTextPlugin.extract('vue-style-loader', 'css-loader')
    }
  },
  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendors',
      chunks: chunks,
      minChunks: chunks.length
    }),
    new ExtractTextPlugin('css/[name].css')
  ]
};

var prod = process.env.NODE_ENV === 'production';
module.exports.plugins = (module.exports.plugins || []);
if (prod) {
  module.exports.devtool = 'source-map';
  module.exports.plugins = module.exports.plugins.concat([
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
  var conf = {
    filename: prod? '../Application/Home/View/' + pathname + '.html' : pathname + '.html',
    template: pages[pathname],
    inject: true,
    minify: {
      removeComments: true,
      collapseWhitespace: false
    }
  };
  if (pathname in module.exports.entry) {
    conf.chunks = ['vendors', pathname];
    conf.hash = false;
  }
  module.exports.plugins.push(new HtmlWebpackPlugin(conf));
}


function getEntry(globPath) {
  var entries = {},
    basename, tmp, pathname;

  glob.sync(globPath).forEach(function (entry) {
    basename = path.basename(entry, path.extname(entry));
    tmp = entry.split('/').splice(-3);
    pathname = tmp.splice(0, 1) + '/' + basename; // 正确输出js和html的路径
    entries[pathname] = entry;
  });
  console.log(entries);
  return entries;
}