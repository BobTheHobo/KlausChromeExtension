let port
let enabled = false;
let scanEnabled = false;
let blocklist = [];

//runs when extension first installed, updated, or when chrome updated
chrome.runtime.onInstalled.addListener(() => {
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
    });

    chrome.storage.sync.set({ scanEnabled: false }); //set scanEnabled when first installed

    connectToNativePort(); //creates a port that's open for the lifetime of extension

    console.log("Klaus disabled for first runtime")
});

function connectToNativePort() {
    try {
        port = chrome.runtime.connectNative("msgtest"); //change msgtest to the native app's name defined in app's json manifest
    } catch (e) {
        console.log("Error when connecting to native port: " + e)
    }
}

// Listen for messages from native app as long as port is still defined
chrome.runtime.onConnectNative.addListener(() => {
    if (port != undefined) {
        port.onMessage.addListener((response) => {
            console.log(`Received: ${response}`);
        });
    }
})

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