let enabled = false;
let blocklist = [];

//runs when extension first installed, updated, or when chrome updated
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ "blockerEnabled": false }); //set blocklist to false when first installed
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

    console.log("Klaus disabled for first runtime")
});

// Listen for option changes and sync here
chrome.storage.onChanged.addListener(changeData => {
    if (changeData.blockedWebsites) {
        blocklist = changeData.blockedWebsites.newValue;
    }

    if (changeData.blockerEnabled) {
        enabled = changeData.blockerEnabled.newValue;
    }
});

//onUpdated tab handler
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.url) {
        url = changeInfo.url;
        const hostname = new URL(url).hostname;
        console.log("User navigated to: " + hostname);

        if (enabled && blocklist.find(domain => hostname.includes(domain))) {
            chrome.tabs.remove(tabId);
            console.log("Klaus blocked " + hostname);
        }
    }
});