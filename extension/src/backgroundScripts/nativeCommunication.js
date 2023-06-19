import {
    setBlockerEnabled
} from "./extensionFunctions.js"

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

//Testing only variables, set testingActive to true if testing and TESTING_NATIVE_APP_NAME to manifest name
const TESTING_NATIVE_APP_NAME = ""
let testingActive = false;

function requestBlocklistFromNative() {
    postToNative(REQUEST_BLOCKLIST_MESSAGE)
}

function openNativeKlaus() {
    postToNative(OPEN_KLAUS_MESSAGE)
}

async function openNativePort() { //initiates correct OS vars then creates a port that's open for the lifetime of extension
    manifestName = await setManifestName()
    await connectToNativePort(manifestName);
}

async function setManifestName(userOS) {
    let manifestName = ""

    let platformInfo = await chrome.runtime.getPlatformInfo()
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
        let blockliststr = responseFromNative.trim().replace("BLOCKLIST:", "")

        let blocklistlist = blockliststr.split(",")

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

    chrome.storage.sync.set({ "receivedTextFromNativeApp": responseFromNative });
}

function nativePortDisconnectHandler() {
    console.log("Communication port between Native and Extension disconnected, any errors are printed next:")
    console.log(chrome.runtime.lastError)
    nativeCommunicationPort = null
}

export {
    openNativePort,
    openNativeKlaus,
    requestBlocklistFromNative,
    postToNative
}
