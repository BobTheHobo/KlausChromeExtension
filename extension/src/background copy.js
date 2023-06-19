const APPLE_NATIVE_APP_NAME = "klauscommmanagerapple"
const WIN_NATIVE_APP_NAME = "klauscommmanagerwin"

const PORT_ESTABLISHED_MESSAGE = "PORT_ESTABLISHED"
const COMM_MANAGER_OPENED_MESSAGE = "COMM_MANAGER_OPENED"
const REQUEST_BLOCKLIST_MESSAGE = "REQUEST_BLOCKLIST"
const ENABLE_BLOCKLIST_MESSAGE = "ENABLE_BLOCKLIST"
const ENABLE_BLOCKLIST_SUCCESS_MESSAGE = "ENABLE_BLOCKLIST_SUCCESS"
const OPEN_KLAUS_MESSAGE = "OPEN_KLAUS"

const GET_EXTENSION_ID = "GET_ID"

let nativeCommunicationPort
let manifestName = "";
let blockerEnabled = false;
let scanEntireUrl = false;
let websiteBlocklist = [];

//Testing only variables, set testingActive to true if testing and TESTING_NATIVE_APP_NAME to manifest name
const TESTING_NATIVE_APP_NAME = ""
let testingActive = false;

main()

function main() {
    //runs when extension first installed, updated, or when chrome updated
    chrome.runtime.onInstalled.addListener(onInstallAndUpdate);

    // Listen for option changes and sync here
    chrome.storage.onChanged.addListener(changeData => changeDataListener(changeData));
    chrome.tabs.onUpdated.addListener((tabId, changeInfo) => tabsUpdatedListener(tabId, changeInfo));

    chrome.action.onClicked.addListener(openOptionsPage); //opens option page when the extension button is clicked
}

function onInstallAndUpdate() {
    openNativePort();

    setBlockerEnabled(false)

    chrome.storage.sync.get(chromeSyncStorageData => chromeStorageUpdater(chromeSyncStorageData))

    chrome.runtime.onMessage.addListener(communicationFromOptionsScriptHandler) //adds listener to messages from options.js
}

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

function communicationFromOptionsScriptHandler(messageObject, sender, sendResponse) {
    //sanitize input for security
    sanitizedMessageObject = sanitizeInput(messageObject)

    // 2. A content script sent a message, respond acknowledgement
    switch(sanitizedMessageObject.action) {
        case "refreshBlocklistFromNative":
            requestBlocklistFromNative();

            sendResponse("Website blocklist requested from Native Klaus")
            break;
        case "sendToNative":
            postToNative(sanitizedMessageObject.message)

            sendResponse("Message \"" + sanitizedMessageObject.message + "\" sent to Native Klaus")
            break;
        case "openNative":
            postToNative(OPEN_KLAUS_MESSAGE)

            sendResponse("Message to open Klaus sent to Native Klaus")
            break;
        case "sendNewBlocklist":
            postToNative()

            sendResponse("New blocklist sent to Native Klaus")
            break;
    }
}

function requestBlocklistFromNative() {
    postToNative(REQUEST_BLOCKLIST_MESSAGE)
}

function sanitizeInput(messageObject) {
    for (const key in messageObject) {
        messageObject[key] = messageObject[key].replace(/&/g, '&amp;')
        messageObject[key] = messageObject[key].replace(/</g, '&lt;')
        messageObject[key] = messageObject[key].replace(/"/g, '&quot;')
    }

    return messageObject;
}

function openNativeKlaus() {
    postToNative(OPEN_KLAUS_MESSAGE)
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

async function openNativePort() { //initiates correct OS vars then creates a port that's open for the lifetime of extension
    manifestName = await setManifestName()
    await connectToNativePort(manifestName);
}

async function setManifestName(userOS) {
    let manifestName = ""

    platformInfo = await chrome.runtime.getPlatformInfo()
    userOS = platformInfo.os

    switch (userOS) {
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

    return manifestName
}


async function connectToNativePort(manifestName) {
    try {
        nativeCommunicationPort = chrome.runtime.connectNative(manifestName); //klauscommmanagerapple manifestName

        postToNative(PORT_ESTABLISHED_MESSAGE)

        postToNative(GET_EXTENSION_ID + ":" + chrome.runtime.id)

        //listens for messages from native app
        nativeCommunicationPort.onMessage.addListener(responseFromNative => nativeMessageHandler(responseFromNative));

        nativeCommunicationPort.onDisconnect.addListener(nativePortDisconnectHandler);
    } catch (e) {
        console.error("Error when connecting to native port: " + e)
    }
}

async function postToNative(message) {
    if (nativeCommunicationPort == undefined) {
        await openNativePort()
    }
    nativeCommunicationPort.postMessage(message)
}

function nativeMessageHandler(responseFromNative) {
    if (chrome.runtime.lastError) {
        console.error("Runtime error: " + chrome.runtime.lastError.message); //todo: handle runtime.lasterror
        return
    }

    if (responseFromNative == COMM_MANAGER_OPENED_MESSAGE) {
        requestBlocklistFromNative();
    }

    if (responseFromNative == "EMPTY_BLOCKLIST") {
        console.log("Given blocklist is empty")
    }

    if (responseFromNative.startsWith("BLOCKLIST:")) {
        blockliststr = responseFromNative.trim().replace("BLOCKLIST:", "")

        blocklistlist = blockliststr.split(",")

        chrome.storage.sync.set({ blockedWebsites: blocklistlist });
        console.log("Received blocklist: \n" + blockliststr)
    }

    if (responseFromNative == ENABLE_BLOCKLIST_MESSAGE) {
        setBlockerEnabled(true)
        postToNative(ENABLE_BLOCKLIST_SUCCESS_MESSAGE)
        console.log("Blocklist enabled")
    }

    if (responseFromNative == GET_EXTENSION_ID) {
        postToNative(GET_EXTENSION_ID + ":" + chrome.runtime.id)
    }

    chrome.storage.sync.set({ receivedTextFromNativeApp: responseFromNative });
}

function nativePortDisconnectHandler() {
    console.log("Communication port between Native and Extension disconnected, any errors are printed next:")
    console.log(chrome.runtime.lastError)
    nativeCommunicationPort = null
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
