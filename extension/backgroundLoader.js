// This script is simply to import all of the necessary scripts for the background script to run
try {
    importScripts('/background.js', '/klausHomepage.js');
} catch (e) {
    console.error(e);
}