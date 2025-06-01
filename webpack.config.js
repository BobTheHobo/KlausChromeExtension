const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  mode: 'development',
  devtool: 'cheap-module-source-map',
  entry: {
    background: "./src/backgroundScripts/index.js",
    options: "./src/contentScripts/options.js",
    klausHomepage: "./src/contentScripts/klausHomepage.js",
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'pages/klausHomepage.html',
      template: './src/pages/klausHomepage.html',
      chunks: ['klausHomepage'],
      inject: 'body'
    }),
    new HtmlWebpackPlugin({
      filename: 'pages/options.html',
      template: './src/pages/options.html',
      chunks: ['options'],
      inject: 'body'
    }),
  ]
}