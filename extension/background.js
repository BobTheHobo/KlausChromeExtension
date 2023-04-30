const APPLE_NATIVE_APP_NAME = "klauscommmanagerapple"
const WIN_NATIVE_APP_NAME = "klauscommmanagerwin"

const PORT_ESTABLISHED_MESSAGE = "PORT_ESTABLISHED"
const COMM_MANAGER_OPENED_MESSAGE = "COMM_MANAGER_OPENED"
const REQUEST_BLOCKLIST_MESSAGE = "REQUEST_BLOCKLIST"
const ENABLE_BLOCKLIST_MESSAGE = "ENABLE_BLOCKLIST"
const ENABLE_BLOCKLIST_SUCCESS_MESSAGE = "ENABLE_BLOCKLIST_SUCCESS"
const OPEN_KLAUS_MESSAGE = "OPEN_KLAUS"

const GET_EXTENSION_ID = "GET_ID"

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

    setBlockerEnabled(false) //set blocklist to false when first installed

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

    chrome.runtime.onMessage.addListener(optionsHandler);
});

function optionsHandler(object, sender, sendResponse) {
    //sanitize input for security
    for (const key in object) {
        object[key] = sanitizeInput(object[key])
    }

    // 2. A content script sent a message, respond acknowledgement
    if (object.action === "refreshBlocklist") {
        requestBlocklist();

        sendResponse("Blocklist requested")
    }

    if (object.action == "sendToNative") {
        postToNative(object.message)

        sendResponse("Message \"" + object.message + "\" sent")
    }

    if (object.action == "openNative") {
        postToNative(OPEN_KLAUS_MESSAGE)

        sendResponse("Message to open Klaus sent")
    }
}

function requestBlocklist() {
    postToNative(REQUEST_BLOCKLIST_MESSAGE)
}

function sanitizeInput(input) {
    return input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
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

            postToNative(PORT_ESTABLISHED_MESSAGE)

            postToNative(GET_EXTENSION_ID + ":" + chrome.runtime.id)

            //listens for messages from native app
            port.onMessage.addListener(nativeMessageHandler);

            port.onDisconnect.addListener(disconnectHandler);

            resolve();
        } catch (e) {
            console.log("Error when connecting to native port: " + e)
            resolve();
        }
    })
}

async function postToNative(message) {
    if (port == undefined) {
        await openNativePort()
    }
    port.postMessage(message)
}

function nativeMessageHandler(response) {
    if (chrome.runtime.lastError) {
        console.warn("Runtime error: " + chrome.runtime.lastError.message); //todo: handle runtime.lasterror
    } else {
        if (response == COMM_MANAGER_OPENED_MESSAGE) {
            requestBlocklist();
        }

        if (response == "EMPTY_BLOCKLIST") {
            console.log("Given blocklist is empty")
        }

        if (response.startsWith("BLOCKLIST:")) {
            blockliststr = response.trim().replace("BLOCKLIST:", "")

            blocklistlist = blockliststr.split(",")

            chrome.storage.sync.set({ blockedWebsites: blocklistlist });
            console.log("Received blocklist: \n" + blockliststr)
        }

        if (response == ENABLE_BLOCKLIST_MESSAGE) {
            setBlockerEnabled(true)
            postToNative(ENABLE_BLOCKLIST_SUCCESS_MESSAGE)
            console.log("Blocklist enabled")
        }

        if (response == GET_EXTENSION_ID) {
            postToNative(GET_EXTENSION_ID + ":" + chrome.runtime.id)
        }

        chrome.storage.sync.set({ receivedtext: response });
    }
}

function disconnectHandler() {
    console.log("Background port disconnected, any errors are printed next:")
    console.log(chrome.runtime.lastError)
    port = null
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