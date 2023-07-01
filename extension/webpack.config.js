const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin')

//insert background scripts here and in the backgroundScripts folder
backgroundScripts = [
  "nativeCommunication.js",
  "extensionCommunication.js",
  "extensionFunctions.js",
  "setup.js",
  "firebaseSetup.js",
]

//insert content scripts here and in the contentScripts folder
contentScripts = [
  "options.js",
  "klausHomepage.js"
]

//turns an array of script names into an array of paths
function transformAllScriptNamesToPaths(scriptType, scriptNames) {
  return scriptNames.map(scriptName => {
    return "./src/" + scriptType + "/" + scriptName
  })
}

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