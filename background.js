chrome.runtime.onInstalled.addListener(() => {
    //runs when extension first installed, updated, or when chrome updated
    chrome.storage.sync.set({ "blockerEnabled": false });
    chrome.action.setBadgeText({
        text: "OFF",
    });

    //if blocked websites array wonky, reset
    chrome.storage.sync.get("blockedWebsites", function(data) {
        if (!Array.isArray(data.blockedWebsites)) {
            chrome.storage.local.set({ blockedWebsites: [] });
            console.log("Blocked websites array reset on first runtime")
        }
    });

    console.log("Klaus disabled for first runtime")
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo) {
    const url = changeInfo.pendingUrl || changeInfo.url;
    if (!url || !url.startsWith("http")) {
        return;
    }

    const hostname = new URL(url).hostname;
    console.log("User navigated to: " + hostname);

    chrome.storage.sync.get(["blockedWebsites", "blockerEnabled"], function(data) {
        const blocked = data.blockedWebsites;
        const enabled = data.blockerEnabled;

        if (Array.isArray(blocked) && enabled && blocked.find(domain => hostname.includes(domain))) {
            console.log("Klaus blocked " + hostname);
            chrome.tabs.remove(tabId);
        }
    });
});