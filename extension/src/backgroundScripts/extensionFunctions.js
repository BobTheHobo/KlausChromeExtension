let blockerEnabled = false;
let scanEntireUrl = false;
let websiteBlocklist = [];
let receivedTextFromNativeApp = "";

function chromeStorageUpdater(chromeSyncStorageData) {
    if (!Array.isArray(chromeSyncStorageData.blockedWebsites)) { //if blocked websites array wonky, reset
        chrome.storage.sync.set({ blockedWebsites: [] });
        console.log("Blocked websites array reset on first runtime")
    }

    websiteBlocklist = chromeSyncStorageData.blockedWebsites;

    if (chromeSyncStorageData.receivedTextFromNativeApp) {
        receivedTextFromNativeApp = chromeSyncStorageData.receivedTextFromNativeApp
    }

    chrome.storage.sync.set({ scanEntireUrl: false }); //set scanEntireUrl when first installed
}

function setBlockerEnabled(blockerEnabled) {
    chrome.storage.sync.set({ blockerEnabled })
    if (blockerEnabled == false) {
        chrome.action.setBadgeText({
            text: "OFF", //set badgetext to off
        });
    } else if (blockerEnabled == true) {
        chrome.action.setBadgeText({
            text: "ON", //set badgetext to on
        });
    }
}

function tabsUpdatedListener(tabId, changeInfo) {
    if(!changeInfo.url){
        return
    }

    let url = new URL(changeInfo.url);
    console.log("User navigated to: " + url);

    if(!blockerEnabled){
        return
    }

    if(scanEntireUrl) {
        url = url.toString()
    } else {
        url = url.hostname.toString();
    }

    if (websiteBlocklist.find(domain => url.includes(domain))) { //Sees if the url has been blocked
        chrome.tabs.remove(tabId);
        console.log("Klaus blocked " + url);
    }
}

function changeDataListener(changeData) {
    if (changeData.blockedWebsites) {
        websiteBlocklist = changeData.blockedWebsites.newValue;
    }

    if (changeData.blockerEnabled) {
        blockerEnabled = changeData.blockerEnabled.newValue;
    }

    if (changeData.scanEntireUrl) {
        scanEntireUrl = changeData.scanEntireUrl.newValue;
    }

    if (changeData.receivedTextFromNativeApp) {
        receivedTextFromNativeApp = changeData.receivedTextFromNativeApp.newValue
    }
}

function openOptionsPage() {
    chrome.runtime.openOptionsPage(() => {
        console.log("Options page opened")
    })
}


export { 
    chromeStorageUpdater, 
    tabsUpdatedListener,
    changeDataListener,
    setBlockerEnabled, 
    openOptionsPage,
}