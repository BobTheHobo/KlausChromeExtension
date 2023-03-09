# KlausChromeExtension

## Setup

### Load Extension
1. Enable Developer Mode in Chrome Extensions
2. Click "Load unpacked"
3. Choose the "extension" folder inside KlausChromeExtension

### Prepare host manifest
1. Copy the given ID for Klaus Website Blocker on the Chrome Extensions page
2. Open msgtest.JSON inside the "extension" folder
3. Replace "INSERT_EXTENSION_ID_HERE" with the ID (e.g. "chrome-extension://bmhookookgapmbfojkpbncfciamfoibh/")

The following step will differ based on if you're using Mac or Windows:

**Mac:**
1. Replace "INSERT_PATH_HERE" with an absolute path to msgtest.py on your computer
    1. See the [documentation](https://developer.chrome.com/docs/apps/nativeMessaging/#native-messaging-host) for more detail
    
**Windows:**
1. Refer to the path field listed in this [table](https://developer.chrome.com/docs/apps/nativeMessaging/#native-messaging-host) for instructions

### Insert host manifest file
1. Follow [these](https://developer.chrome.com/docs/apps/nativeMessaging/#native-messaging-host-location) instructions on how/where to install 
the manifest file based on your OS

## Using the extension and app

WIP

## Troubleshooting
- If you get "native host has exited" errors, run chrome in [logging](https://www.chromium.org/for-testers/enable-logging/) mode

      /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --enable-logging --v=1
        
- If you get a permission error, try running "chmod u+x msgtest.py" inside a terminal inside msgtest.py's directory folder.
    - Also make sure you have execute permissions for msgtest.py
    
- Refer to the [docs](https://developer.chrome.com/docs/apps/nativeMessaging/#native-messaging-debugging) for more troubleshooting
    - (TBH it's not too specific, but it's good as a general starting point)


