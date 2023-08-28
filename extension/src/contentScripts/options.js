require('../css/klausHomepage.css')

import { saveBlocklistToFirestore } from "../backgroundScripts/firebaseFunctions";

const blockedWebsitesTextArea = document.getElementById("blockedWebsitesTextArea");
const whitelistTextArea = document.getElementById("whitelistTextArea");
const saveBlocklistButton = document.getElementById("saveBlocklistButton");
const saveWhitelistButton = document.getElementById("saveWhitelistButton");
const enableWebsiteBlockingCheckbox = document.getElementById("enableWebsiteBlockingCheckbox");
const urlOptionChekbox = document.getElementById("scanEntireUrlCheckbox");
const testButton = document.getElementById("testButton");
const receivedFromNativeAppTextArea = document.getElementById("receivedFromNativeAppTextArea");
const openKlausButton = document.getElementById("openKlausButton")
const enableWebsiteTrackingCheckbox = document.getElementById("enableWebsiteTrackingCheckbox")
const openKlausOnNewTabCheckbox = document.getElementById("openKlausOnNewTabCheckbox")

main()

function main() {
    refreshBlocklistFromNative(); //updates blocklist when the options popup/page is opened

    saveBlocklistButton.addEventListener("click", saveBlocklist);
    saveWhitelistButton.addEventListener("click", saveWhitelist);
    testButton.addEventListener("click", testEvent);
    openKlausButton.addEventListener("click", openNativeKlaus);

    enableWebsiteBlockingCheckbox.addEventListener("change", event => websiteBlockingEventHandler(event));
    scanEntireUrlCheckbox.addEventListener("change", event => scanEntireUrlEventListener(event));
    enableWebsiteTrackingCheckbox.addEventListener("change", event => websiteTrackingHandler(event))
    openKlausOnNewTabCheckbox.addEventListener("change", event => openKlausAsNewTabHandler(event))

    chrome.storage.onChanged.addListener(storageChangeData => storageChangeHandler(storageChangeData));

    window.addEventListener("DOMContentLoaded", loadAllDataFromChromeStorage);
}

function websiteTrackingHandler(event) {
    const websiteTrackingEnabled = event.target.checked;
    chrome.storage.sync.set({ "websiteTrackingEnabled" : websiteTrackingEnabled })
}

function openKlausAsNewTabHandler(event) {
    const openKlausOnNewTab = event.target.checked;
    chrome.storage.sync.set({ "openKlausOnNewTab" : openKlausOnNewTab })
}

// 1. Send a message to the background
async function sendMessageToBackground(action, message) {
    const object = { action: action, message: message }
    await chrome.runtime.sendMessage(object).then((response) =>
        console.log(response)
    )
}

function sendMessageToNative(message) {
    sendMessageToBackground('sendToNative', message)
}

function refreshBlocklistFromNative() {
    sendMessageToBackground('refreshBlocklistFromNative', '')
}

function openNativeKlaus() {
    sendMessageToBackground('openNative', '')
}

function testEvent() {
    console.log("Sending:  hello");
    sendMessageToNative("hello")
}

function saveBlocklist() {
    const blocked = blockedWebsitesTextArea.value.split("\n").map(s => s.trim()).filter(Boolean);
    chrome.storage.sync.set({ "blockedWebsites": blocked }, () => {
        console.log("Blocked websites saved to chrome sync storage")
    });
    saveBlocklistToFirestore(blocked)
}

function saveWhitelist() {
    const whitelist = whitelistTextArea.value.split("\n").map(s => s.trim()).filter(Boolean);
    chrome.storage.sync.set({ "whitelistedWebsites": whitelist }, () => {
        console.log("Whitelisted websites saved to chrome sync storage")
    });
}

//saves enableWebsiteBlockingCheckbox status to storage, changes checkbox status and badge on input
function websiteBlockingEventHandler(event) {
    const blockerEnabled = event.target.checked;

    chrome.storage.sync.set({ "blockerEnabled": blockerEnabled });

    setBlockerBadgeEnabled(blockerEnabled)

    console.log("Enabled turned to " + blockerEnabled)
}

function setBlockerBadgeEnabled(enabled) {
    if (enabled) {
        chrome.action.setBadgeText({
            text: "ON",
        });
    } else {
        chrome.action.setBadgeText({
            text: "OFF",
        });
    }
}

function scanEntireUrlEventListener(event) {
    const scanEntireUrl = event.target.checked;
    chrome.storage.sync.set({ "scanEntireUrl": scanEntireUrl });
    console.log("Scan entire URL turned to " + scanEntireUrl)
}

//syncs data across all instances (ie popup and full tab options) of the extension when something changes 
function storageChangeHandler(storageChangeData) {
    if (storageChangeData.blockedWebsites) {
        blockedWebsitesTextArea.value = storageChangeData.blockedWebsites.newValue.join("\n");
    }

    if (storageChangeData.whitelistedWebsites) {
        whitelistTextArea.value = storageChangeData.whitelistedWebsites.newValue.join("\n");
    }

    if (storageChangeData.blockerEnabled) {
        enableWebsiteBlockingCheckbox.checked = storageChangeData.blockerEnabled.newValue;
    }

    if (storageChangeData.scanEntireUrl) {
        urlOptionChekbox.checked = storageChangeData.scanEntireUrl.newValue;
    }

    if (storageChangeData.receivedTextFromNativeApp) {
        receivedFromNativeAppTextArea.value = storageChangeData.receivedTextFromNativeApp.newValue
    }

    if (storageChangeData.websiteTrackingEnabled) {
        enableWebsiteTrackingCheckbox.checked = storageChangeData.websiteTrackingEnabled.newValue
    }

    if (storageChangeData.openKlausOnNewTab) {
        openKlausOnNewTabCheckbox.checked = storageChangeData.openKlausOnNewTab.newValue
    }
}

function loadAllDataFromChromeStorage() {
    chrome.storage.sync.get((storageData) => {
        updateBlockedWebsites(storageData);
        updateWhitelistedWebsites(storageData);
        updateReceivedTextFromNativeApp(storageData);
        updateBlockerEnabled(storageData);
        updateScanEntireUrl(storageData);
        updateWebsiteTrackingCheckbox(storageData);
        updateOpenKlausOnNewTabCheckbox(storageData);
    });
}

function updateWebsiteTrackingCheckbox(storageData) {
    if (storageData.websiteTrackingEnabled) {
        enableWebsiteTrackingCheckbox.checked = storageData.websiteTrackingEnabled
    }
}

function updateOpenKlausOnNewTabCheckbox(storageData) {
    if (storageData.openKlausOnNewTab) {
        openKlausOnNewTabCheckbox.checked = storageData.openKlausOnNewTab
    }
}

function updateBlockedWebsites(storageData) {
    if (storageData.blockedWebsites) {
        blockedWebsitesTextArea.value = storageData.blockedWebsites.join("\n");
    } else {
        chrome.storage.sync.set({ blockedWebsites: [] });
        console.log("blockedWebsites reset to empty array");
    }
}

function updateWhitelistedWebsites(storageData) {
    if (storageData.whitelistedWebsites) {
        whitelistTextArea.value = storageData.whitelistedWebsites.join("\n");
    } else {
        chrome.storage.sync.set({ whitelistedWebsites: [] });
        console.log("whitelistedWebsites reset to empty array");
    }
}

function updateReceivedTextFromNativeApp(storageData) {
    if (storageData.receivedTextFromNativeApp) {
        receivedFromNativeAppTextArea.value = storageData.receivedTextFromNativeApp;
    } else {
        chrome.storage.sync.set({ receivedTextFromNativeApp: "" });
        console.log("receivedTextFromNativeApp reset to empty string");
    }
}

function updateBlockerEnabled(storageData) {
    if (typeof storageData.blockerEnabled === "boolean") {
        enableWebsiteBlockingCheckbox.checked = storageData.blockerEnabled;
        setBlockerBadgeEnabled(storageData.blockerEnabled);
    } else {
        chrome.storage.sync.set({ blockerEnabled: false });
        console.log("blockerEnabled reset to false");
    }
}

function updateScanEntireUrl(storageData) {
    if (typeof storageData.scanEntireUrl === "boolean") {
        scanEntireUrlCheckbox.checked = storageData.scanEntireUrl;
    } else {
        chrome.storage.sync.set({ scanEntireUrl: false });
        console.log("scanEntireUrl reset to false");
    }
}