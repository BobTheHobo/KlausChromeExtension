const path = require('path');

//insert background scripts here and in the backgroundScripts folder
scripts = [
  "klausHomepage.js",
  "nativeCommunication.js",
  "extensionCommunication.js",
  "extensionFunctions.js",
  "setup.js"
]

//turns a script name into a path
function transformScriptNameToPath(scriptName) {
  return "./src/backgroundScripts/" + scriptName
}

//turns an array of script names into an array of paths
function transformAllScriptNamesToPaths(scriptNames) {
  return scriptNames.map(scriptName => transformScriptNameToPath(scriptName))
}

module.exports = {
  mode: 'production',
  entry: transformAllScriptNamesToPaths(scripts),
  // This will output a single file under `dist/bundle.js`
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  }
}