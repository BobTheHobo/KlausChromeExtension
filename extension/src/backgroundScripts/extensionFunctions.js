import xicon from "../icons/xicon.png";

let blockerEnabled = false;
let scanEntireUrl = false;
let websiteBlocklist = [];
let whitelistedWebsites = [];
let receivedTextFromNativeApp = "";

function chromeStorageUpdater(chromeSyncStorageData) {
    if (!Array.isArray(chromeSyncStorageData.blockedWebsites)) { //if blocked websites array wonky, reset
        chrome.storage.sync.set({ blockedWebsites: [] });
        console.log("Blocked websites array reset on first runtime")
    }

    if (!Array.isArray(chromeSyncStorageData.whitelistedWebsites)) { //if blocked websites array wonky, reset
        chrome.storage.sync.set({ whitelistedWebsites: [] });
        console.log("Whitelisted websites array reset on first runtime")
    }

    websiteBlocklist = chromeSyncStorageData.blockedWebsites;
    whitelistedWebsites = chromeSyncStorageData.whitelistedWebsites;

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
    console.log("blocker enabled set to " + blockerEnabled)
}

//handles everything related to tabs and url info
function tabsUpdatedListener(tabId, changeInfo) {
    if(!changeInfo.url){
        return
    }
    let url = new URL(changeInfo.url);
    console.log("User navigated to: " + url);

    websiteBlocker(tabId, url);

}

function tabCreatedListener(tab) {
    if(!tab.pendingUrl){
        return
    }
    let url = new URL(tab.pendingUrl);

    updateNewTab(url);
}


// changes tab to Google's default new tab or Klaus new tab
function updateNewTab(url) {
    chrome.storage.sync.get(storage => {
        if(storage.homepageConfig["openKlausOnNewTab"]) {
            return //if openKlausOnNewTab is true, do nothing
        }

        if(url != "chrome://newtab/") {
            return //if url is not chrome's default new tab, do nothing
        }

        chrome.tabs.update({ url: "chrome-search://local-ntp/local-ntp.html" }) //this is the address to Google's default new tab, taken from that one extension Google made for Star Wars wallpapers
    })
}


//blocks websites according to url
function websiteBlocker(tabId, url) {
    if(!blockerEnabled){
        return
    }

    let urlString = url.toString();

    if (whitelistedWebsites.find(domain => urlString.includes(domain))) { //Sees if the url has been whitelisted
        return //if whitelisted, do nothing
    }    

    if(scanEntireUrl == false) {
        urlString = url.hostname.toString();
    }

    console.log("Scanning " + urlString + " for blocked websites")

    if (websiteBlocklist.find(domain => urlString.includes(domain))) { //Sees if the url has been blocked
        createNotification("Klaus blocked a website", "Klaus blocked " + urlString)
        chrome.tabs.remove(tabId);
        console.log("Klaus blocked " + urlString);
    }
}

function changeDataListener(changeData) {
    if (changeData.blockedWebsites) {
        websiteBlocklist = changeData.blockedWebsites.newValue;
    }

    if (changeData.whitelistedWebsites) {
        whitelistedWebsites = changeData.whitelistedWebsites.newValue;
    }
    
    if (changeData.blockerEnabled) {
        blockerEnabled = changeData.blockerEnabled.newValue;
        if (blockerEnabled == true){
            scanCurrentTabsForBlock()
        }
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

function getBlocklist() {
    chrome.storage.sync.get("blockedWebsites", (blocklist) => {
        return blocklist
    })
}

function createNotification(title, message){
    chrome.notifications.create(
        "Example",
        {
            type: "basic",
            title: title,
            message: message,
            iconUrl: "icons/xicon.png",
            requireInteraction: true,
            priority: 2
        }
    );
    // chrome.notifications.clear("Example");
}

function getAllTabs(){
    return new Promise(async (resolve) => {
        await chrome.tabs.query({}, (tabs) => {
            resolve(tabs)
        })
    })
}

async function scanCurrentTabsForBlock(){
    let tabs = await getAllTabs()
    for(let tab of tabs){
        websiteBlocker(tab.id, new URL(tab.url))
    }
}

export { 
    chromeStorageUpdater, 
    tabsUpdatedListener,
    changeDataListener,
    setBlockerEnabled, 
    openOptionsPage,
    tabCreatedListener,
    getBlocklist
}