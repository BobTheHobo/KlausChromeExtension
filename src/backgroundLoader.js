// This script is used by webpack to bundle all of the background scripts into one file
try {
    importScripts('../dist/background.bundle.js');
} catch (e) {
    console.error(e);
}