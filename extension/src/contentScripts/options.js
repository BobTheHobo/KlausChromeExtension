require('../css/klausHomepage.css')

import { saveBlocklistToFirestore } from "../backgroundScripts/firebaseFunctions";
import { updateHomepageMessage } from "../backgroundScripts/extensionConfig";

const blockedWebsitesTextArea = document.getElementById("blockedWebsitesTextArea");
const whitelistTextArea = document.getElementById("whitelistTextArea");
const saveBlocklistButton = document.getElementById("saveBlocklistButton");
const saveWhitelistButton = document.getElementById("saveWhitelistButton");
const enableWebsiteBlockingCheckbox = document.getElementById("enableWebsiteBlockingCheckbox");
const scanEntireUrlCheckbox = document.getElementById("scanEntireUrlCheckbox");
const testButton = document.getElementById("testButton");
const receivedFromNativeAppTextArea = document.getElementById("receivedFromNativeAppTextArea");
const openKlausButton = document.getElementById("openKlausButton")
const enableWebsiteTrackingCheckbox = document.getElementById("enableWebsiteTrackingCheckbox")
const openKlausOnNewTabCheckbox = document.getElementById("openKlausOnNewTabCheckbox")
const homepageMessageTextArea = document.getElementById("homepageMessageTextArea")
const saveHomepageMessageButton = document.getElementById("saveHomepageMessageButton")
const homepageColorPicker = document.getElementById("homepageBackgroundColorPicker")
const saveHomepageColorButton = document.getElementById("saveHomepageBackgroundColorButton")

function main() {
    
    refreshBlocklistFromNative(); //updates blocklist when the options popup/page is opened

    new WebsiteBlocker(enableWebsiteBlockingCheckbox, 
        blockedWebsitesTextArea,
        saveBlocklistButton,
        whitelistTextArea,
        saveWhitelistButton,
        scanEntireUrlCheckbox
    )


    testButton.addEventListener("click", testEvent);
    openKlausButton.addEventListener("click", openNativeKlaus);
    saveHomepageMessageButton.addEventListener("click", saveHomepageMessage);
    saveHomepageColorButton.addEventListener("click", updateBackgroundColor);

    enableWebsiteTrackingCheckbox.addEventListener("change", event => websiteTrackingHandler(event))
    openKlausOnNewTabCheckbox.addEventListener("change", event => openKlausAsNewTabHandler(event))

    chrome.storage.onChanged.addListener(storageChangeData => storageChangeHandler(storageChangeData));

    window.addEventListener("DOMContentLoaded", loadAllDataFromChromeStorage);
}

//Handlers
function websiteTrackingHandler(event) {
    const websiteTrackingEnabled = event.target.checked;
    chrome.storage.sync.set({ "websiteTrackingEnabled" : websiteTrackingEnabled })
}

function openKlausAsNewTabHandler(event) {
    const openKlausOnNewTab = event.target.checked;
    chrome.storage.sync.set({ "openKlausOnNewTab" : openKlausOnNewTab })
}

//Klaus Communication Functions
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

function saveHomepageMessage() {
    const homepageMessage = homepageMessageTextArea.value
    updateHomepageMessage(homepageMessage)
}

function saveWhitelist() {
    const whitelist = whitelistTextArea.value.split("\n").map(s => s.trim()).filter(Boolean);
    chrome.storage.sync.set({ "whitelistedWebsites": whitelist }, () => {
        console.log("Whitelisted websites saved to chrome sync storage")
    });
}

//syncs data across all instances (ie popup and full tab options) of the extension when something changes 
function storageChangeHandler(storageChangeData) {

    if (storageChangeData.receivedTextFromNativeApp) {
        receivedFromNativeAppTextArea.value = storageChangeData.receivedTextFromNativeApp.newValue
    }

    if (storageChangeData.websiteTrackingEnabled) {
        enableWebsiteTrackingCheckbox.checked = storageChangeData.websiteTrackingEnabled.newValue
    }

    if (storageChangeData.openKlausOnNewTab) {
        openKlausOnNewTabCheckbox.checked = storageChangeData.openKlausOnNewTab.newValue
    }

    if (storageChangeData.homepageConfig) {
        const homepageConfig = storageChangeData.homepageConfig
        console.log(homepageConfig.newValue)
        if (homepageConfig.newValue.homepageWelcomeMessage) {
            homepageMessageTextArea.value = homepageConfig.newValue.homepageWelcomeMessage
        }
    }
}

function loadAllDataFromChromeStorage() {
    chrome.storage.sync.get((storageData) => {
        updateReceivedTextFromNativeApp(storageData);
        updateWebsiteTrackingCheckbox(storageData);
        updateOpenKlausOnNewTabCheckbox(storageData);
    });
    chrome.storage.local.get((storageData) => {
        updateHomepageMessageText(storageData);
    });
}

function updateHomepageMessageText(storageData) {
    console.log(storageData)
    if (storageData.homepageConfig.homepageWelcomeMessage) {
        homepageMessageTextArea.value = storageData.homepageConfig.homepageWelcomeMessage
    }
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

function updateReceivedTextFromNativeApp(storageData) {
    if (storageData.receivedTextFromNativeApp) {
        receivedFromNativeAppTextArea.value = storageData.receivedTextFromNativeApp;
    } else {
        chrome.storage.sync.set({ receivedTextFromNativeApp: "" });
        console.log("receivedTextFromNativeApp reset to empty string");
    }
}

function updateBackgroundColor(){
    const color = homepageColorPicker.value;
    document.body.style.backgroundColor = color;
}


class ChromeStorageHandler {
    constructor() {}

    addChangeListener(keyToListenFor, storageType, callback) {
        chrome.storage.onChanged.addListener((changes, type) => {
            if(changes[keyToListenFor]) {
                if(type === storageType) {
                    callback(changes[keyToListenFor].newValue)
                }else{
                    console.error("Invalid storage type: ", storageType)
                }
            }
        })
    }

    updateChromeStorage(obj, storageType, callback) {
        if(storageType === "sync") {
            chrome.storage.sync.set(obj, () => {
                this.chromeStorageCallback(callback)
            });
        }
        else if(storageType === "local") {
            chrome.storage.local.set(obj, () => {
                this.chromeStorageCallback(callback)
            });
        }
        else {
            console.error("Invalid storage type: ", storageType)
            return;
        }
    }

    chromeStorageCallback(callback) {
        if(chrome.runtime.lastError) {
            console.error("Error updating chrome storage: ", chrome.runtime.lastError)
        }else{
            callback("success")
        }
    }

    async getChromeStorage(key, storageType, callback) {
        try{
            let result;
            if(storageType === "sync") {
                result = await chrome.storage.sync.get(key);
            }
            else if(storageType === "local") {
                result = await chrome.storage.local.get(key);
            }
            else{
                console.error("Invalid storage type: ", storageType)
                return;
            }
            callback(result);
        }catch(err){
            console.error("Error getting chrome storage: ", err)
        }
    }
}

class WebsiteBlocker {
    constructor(enableWebsiteBlockingCheckbox, 
        blocklistTextArea, 
        saveBlocklistButton,
        whitelistTextArea, 
        saveWhitelistButton,
        scanEntireUrlCheckbox) 
    {
        this.enableBlockingCheckbox = enableWebsiteBlockingCheckbox;
        this.blocklistTextArea = blocklistTextArea;
        this.saveBlocklistButton = saveBlocklistButton;
        this.whitelistTextArea = whitelistTextArea;
        this.saveWhitelistButton = saveWhitelistButton;
        this.scanEntireUrlCheckbox = scanEntireUrlCheckbox;
        
        this.blockingEnabled = false;
        this.blocklist = [];
        this.whitelist = [];
        this.scanEntireUrl = false;
        
        this.storageHandler = new ChromeStorageHandler();
        this.updateDOMOnLoad();
        this.addChangeEventHandler();
    }

    updateDOMOnLoad() {
        const objectKeysToLoad = [
            "blockerEnabled",
            "blockedWebsites",
            "whitelistedWebsites",
            "scanEntireUrl"
        ];
        objectKeysToLoad.forEach(key => {
            this.storageHandler.getChromeStorage(key, "sync", (result) => {
                if(key === "blockerEnabled") {
                    this.changeBlockingEnabled(result.blockerEnabled);
                }
                else if(key === "blockedWebsites") {
                    this.changeBlocklist(result.blockedWebsites);
                }
                else if(key === "whitelistedWebsites") {
                    this.changeWhitelist(result.whitelistedWebsites);
                }
                else if(key === "scanEntireUrl") {
                    this.changeScanEntireUrl(result.scanEntireUrl);
                }
            })
        })
    }

    addChangeEventHandler() {
        this.storageEventHandler();
        this.domChangeEventHandler();
    }

    storageEventHandler() {
        this.storageHandler.addChangeListener("blockerEnabled", "sync", (newValue) => {
            this.changeBlockingEnabled(newValue);
        });
        
        this.storageHandler.addChangeListener("blockedWebsites", "sync", (newValue) => {
            this.changeBlocklist(newValue);
        })

        this.storageHandler.addChangeListener("whitelistedWebsites", "sync", (newValue) => {
            this.changeWhitelist(newValue);
        })

        this.storageHandler.addChangeListener("scanEntireUrl", "sync", (newValue) => {
            this.changeScanEntireUrl(newValue);
        });

    }

    domChangeEventHandler() {
        this.enableBlockingCheckbox.addEventListener("change", () => {
            this.changeBlockingEnabled(this.enableBlockingCheckbox.checked)
        })

        this.scanEntireUrlCheckbox.addEventListener("change", () => {
            this.changeScanEntireUrl(this.scanEntireUrlCheckbox.checked);
        })
        
        this.saveBlocklistButton.addEventListener("click", () => {
            this.changeBlocklist(this.blocklistTextArea.value)
        });
        
        this.saveWhitelistButton.addEventListener("click", () => {
            this.changeWhitelist(this.whitelistTextArea.value)
        });
    }

    changeBlockingEnabled(status) {
        try{
            if(status) {
                this.storageHandler.updateChromeStorage({"blockerEnabled": true}, "sync", (result) => {
                    console.log("Blocker enabled: ",  result)
                }) //update chrome storage
                this.blockingEnabled = true; //update class variable
                this.enableBlockingCheckbox.checked = true; //update DOM
                this.setBlockerBadgeEnabled(true); //update badge
            }else if(status === false){
                this.storageHandler.updateChromeStorage({"blockerEnabled": false}, "sync", (result) => {
                    console.log("Blocker disabled: ",  result)
                }) //update chrome storage 
                this.blockingEnabled = false; //update class variable
                this.enableBlockingCheckbox.checked = false; //update DOM
                this.setBlockerBadgeEnabled(false); //update badge
            }else{
                console.error("Invalid status: ", status)
            }
        }catch(err){
            console.error("Error changing blocking enabled status: ", err)
        }
    }

    changeBlocklist(list) {
        try{
            let blocklist = list;
            if(typeof list === "string") {
                blocklist = this.textAreaToArray(list);
            }
            this.storageHandler.updateChromeStorage({"blockedWebsites": blocklist}, "sync", (result) => {
                console.log("Blocklist changed: ", result);
            }); //update chrome storage
            this.blocklist = blocklist; //update class variable
            this.blocklistTextArea.value = blocklist.join("\n"); //update DOM
        }catch(err){
            console.error("Error changing blocklist: ", err)
        }

    }

    changeWhitelist(list) {
        try{
            let whitelist = list;
            if(typeof list === "string") {
                whitelist = this.textAreaToArray(list);
            }
            this.storageHandler.updateChromeStorage({"whitelistedWebsites": whitelist}, "sync", (result) => {
                console.log("Whitelist changed: ", result);
            }); //update chrome storage
            this.whitelist = whitelist; //update class variable
            this.whitelistTextArea.value = whitelist.join("\n"); //update DOM
        }catch(err){
            console.error("Error changing blocklist: ", err)
        }
    }

    changeScanEntireUrl(status) {
        try{    
            if(status) {
                this.storageHandler.updateChromeStorage({"scanEntireUrl": true}, "sync", (result) => {
                    console.log("Scan entire URL enabled: ", result);
                }); //update chrome storage
                this.scanEntireUrl = true; //update class variable
                this.scanEntireUrlCheckbox.checked = true; //update DOM
            }else if(status === false){
                this.storageHandler.updateChromeStorage({"scanEntireUrl": false}, "sync", (result) => {
                    console.log("Scan entire URL disabled: ", result);
                }); //update chrome storage
                this.scanEntireUrl = false; //update class variable
                this.scanEntireUrlCheckbox.checked = false; //update DOM
            }else{
                console.error("Invalid status: ", status)
            }
        }catch(err){
            console.error("Error changing scan entire URL status: ", err)
        }
    }

    setBlockerBadgeEnabled(enabled) {
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

    textAreaToArray(textAreaVal) {
        return textAreaVal.split("\n").map(s => s.trim()).filter(Boolean);
    }
    
    scanEntireUrl(url) {
        
    }

    saveBlocklist() {
        const blocked = this.blockedWebsitesTextArea.value.split("\n").map(s => s.trim()).filter(Boolean);
        this.storageHandler.updateChromeStorage({ "blockedWebsites": blocked }, "sync", (result) => {
            console.log(result);
        });
        saveBlocklistToFirestore(blocked)
    }
}

main();