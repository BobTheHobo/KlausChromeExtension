const APPLE_NATIVE_APP_NAME = "klauscommmanagerapple"
const WIN_NATIVE_APP_NAME = "klauscommmanagerwin"

let port
let manifestName = "";
let enabled = false;
let scanEnabled = false;
let blocklist = [];
let receivedtext = "";

//Testing only variables, set testingActive to true if testing and TESTING_NATIVE_APP_NAME to manifest name
const TESTING_NATIVE_APP_NAME = ""
let testingActive = false;

//runs when extension first installed, updated, or when chrome updated
chrome.runtime.onInstalled.addListener(() => {
    openNativePort();

    chrome.storage.sync.set({ blockerEnabled: false }); //set blocklist to false when first installed
    chrome.action.setBadgeText({
        text: "OFF", //set badgetext to off
    });

    chrome.storage.sync.get(data => { //syncs blockedwebsites
        if (!Array.isArray(data.blockedWebsites)) { //if blocked websites array wonky, reset
            chrome.storage.sync.set({ blockedWebsites: [] });
            console.log("Blocked websites array reset on first runtime")
        }
        blocklist = data.blockedWebsites;

        if (data.receivedtext) {
            receivedtext = data.receivedtext
        }
    });

    chrome.storage.sync.set({ scanEnabled: false }); //set scanEnabled when first installed

    console.log("Klaus disabled for first runtime")
});

async function openNativePort() { //initiates correct OS vars then creates a port that's open for the lifetime of extension
    await handleManifest();
    await connectToNativePort();
}

async function handleManifest() {
    return new Promise((resolve) => {
        chrome.runtime.getPlatformInfo(function(info) {
            switch (info.os) {
                case "mac": //Mac
                    manifestName = APPLE_NATIVE_APP_NAME;
                    break;
                case "win": //Windows
                    manifestName = WIN_NATIVE_APP_NAME;
                    break;
                case "android":

                    break;
                case "cros": //Chrome OS

                    break;
                case "linux":

                    break;
                default:
                    console.log("OS not recognized");
            }

            if (testingActive) {
                console.log("Testing manifest loaded")
                manifestName = TESTING_NATIVE_APP_NAME;
            }

            chrome.storage.sync.set({ manifestName: manifestName });
            resolve();
        });
    })
}


async function connectToNativePort() {
    return new Promise((resolve) => {
        try {
            port = chrome.runtime.connectNative(manifestName); //klauscommmanagerapple manifestName

            //listens for messages from native app
            port.onMessage.addListener((response) => {
                console.log(`Received: ${response}`);
                chrome.storage.sync.set({ receivedtext: response });
            });

            resolve();
        } catch (e) {
            console.log("Error when connecting to native port: " + e)
            resolve();
        }
    })
}

// Listen for option changes and sync here
chrome.storage.onChanged.addListener(changeData => {
    if (changeData.blockedWebsites) {
        blocklist = changeData.blockedWebsites.newValue;
    }

    if (changeData.blockerEnabled) {
        enabled = changeData.blockerEnabled.newValue;
    }

    if (changeData.scanEnabled) {
        scanEnabled = changeData.scanEnabled.newValue;
    }

    if (changeData.receivedtext) {
        receivedtext = changeData.receivedtext.newValue
    }
});

//hostname tab handler
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.url) {
        let url = new URL(changeInfo.url);

        if (scanEnabled) { //if scan whole url is enabled...
            url = url.toString();
        } else { //else only set the url to the hostname (like twitch.tv vs twitch.tv/sneakylol)
            url = url.hostname.toString();
        }

        console.log("User navigated to: " + url);

        if (enabled && blocklist.find(domain => url.includes(domain))) {
            chrome.tabs.remove(tabId);
            console.log("Klaus blocked " + url);
        }
    }
});