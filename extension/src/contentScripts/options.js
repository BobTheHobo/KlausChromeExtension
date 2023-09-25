require('../css/klausHomepage.css')

import { saveBlocklistToFirestore } from "../backgroundScripts/firebaseFunctions";
import { updateHomepageMessage } from "../backgroundScripts/extensionConfig";

//Website Blocker
const enableWebsiteBlockingCheckbox = document.getElementById("enableWebsiteBlockingCheckbox");
const blockedWebsitesTextArea = document.getElementById("blockedWebsitesTextArea");
const saveBlocklistButton = document.getElementById("saveBlocklistButton");
const whitelistTextArea = document.getElementById("whitelistTextArea");
const saveWhitelistButton = document.getElementById("saveWhitelistButton");
const scanEntireUrlCheckbox = document.getElementById("scanEntireUrlCheckbox");

//Native Communication
const receivedFromNativeAppTextArea = document.getElementById("receivedFromNativeAppTextArea");
const openKlausButton = document.getElementById("openKlausButton")
const testButton = document.getElementById("testButton");

//Statistics Tracker
const enableStatTrackingCheckbox = document.getElementById("enableWebsiteTrackingCheckbox")

//Homepage Settings
const openKlausOnNewTabCheckbox = document.getElementById("openKlausOnNewTabCheckbox")
const homepageMessageTextArea = document.getElementById("homepageMessageTextArea")
const saveHomepageMessageButton = document.getElementById("saveHomepageMessageButton")
const homepageColorPicker = document.getElementById("homepageBackgroundColorPicker")
const saveHomepageColorButton = document.getElementById("saveHomepageBackgroundColorButton")

function main() {

    new WebsiteBlocker(
        enableWebsiteBlockingCheckbox, 
        blockedWebsitesTextArea,
        saveBlocklistButton,
        whitelistTextArea,
        saveWhitelistButton,
        scanEntireUrlCheckbox
    )

    new StatisticTracker(
        enableStatTrackingCheckbox
    )

    new HomepageSettings(
        openKlausOnNewTabCheckbox,
        homepageMessageTextArea,
        saveHomepageMessageButton,
        homepageColorPicker,
        saveHomepageColorButton
    )
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

    async getAndCreateChromeStorageIfNull(key, defaultValue, storageType, callback) {
        try{
            await this.getChromeStorage(key, storageType, (result) => {
                if(result[key] === undefined) {
                    console.log("No data found for " + key + ", creating new key")
                    this.createNewChromeStorage(key, defaultValue, storageType, (result) => {
                        console.log("   New key created: ", result);
                        callback(result[key]);
                    });
                }else{
                    callback(result[key]);
                }
            })
        }catch(err){
            console.error("Error getting and creating chrome storage: ", err)
        }
    }

    createNewChromeStorage(key, value, storageType, callback) {
        try{
            let obj = {};
            obj[key] = value;
            this.updateChromeStorage(obj, storageType, callback);
        }catch(err){
            console.error("Error when creating new chrome storage key: ", err)
            throw new Error("Uninitialized chrome storage key");
        }
    }
}

class OptionsPageModule { //this is the general format for all modules
    //DOM elements
    //Class variables
    //Other
    #storageHandler;

    constructor(
        //insert all DOM elements here
    ) {
        //insert all DOM elements here
        this.#storageHandler = new ChromeStorageHandler();
        this.#onLoad();
        this.#addChangeEventHandlers();
    } 

    #onLoad() { //runs when DOM is loaded
        window.addEventListener("DOMContentLoaded", () => {
            this.updateDOM()
        });
    }

    updateDOM() { //loads data from chrome storage and updates DOM
        const keyDefaultValueObjectsToLoad = {};

        for(const key in keyDefaultValueObjectsToLoad) {
            try{
                this.#storageHandler.getAndCreateChromeStorageIfNull(key, keyDefaultValueObjectsToLoad[key], "sync", (result) => {
                    //insert code to update DOM here
                });
            }catch(err){
                console.error("Error updating DOM: ", err)
            }   
        }
    }

    #addChangeEventHandlers() { //adds both storage and DOM event handlers
        this.#storageEventHandler();
        this.#DOMChangeEventHandler();
    }

    #storageEventHandler() { //anything pertaining to chrome storage changes
        this.#storageHandler.addChangeListener("", "sync", (newValue) => {
            //insert code to handle storage changes here
        });
    }

    #DOMChangeEventHandler() { //anything pertaining to DOM changes, e.g. button clicks
        //insert code to handle DOM changes here
    }
}


class WebsiteBlocker extends OptionsPageModule{
    //DOM elements
    enableBlockingCheckbox;
    blocklistTextArea;
    saveBlocklistButton;
    whitelistTextArea;
    saveWhitelistButton;
    scanEntireUrlCheckbox;
    //Class variables
    blockingEnabled;
    blocklist;
    whitelist;
    scanEntireUrl;
    //Other
    #storageHandler;


    constructor(enableWebsiteBlockingCheckbox, 
        blocklistTextArea, 
        saveBlocklistButton,
        whitelistTextArea, 
        saveWhitelistButton,
        scanEntireUrlCheckbox) 
    {
        super();
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
        
        this.#storageHandler = new ChromeStorageHandler();
        this.#onLoad();
    }

    #onLoad() {
        window.addEventListener("DOMContentLoaded", () => {
            this.updateDOM()
            this.#addChangeEventHandlers();
        });
    }

    updateDOM() {
        const keyDefaultValueObjectsToLoad = {
            "blockerEnabled": this.blockingEnabled,
            "blockedWebsites": this.blocklist,
            "whitelistedWebsites": this.whitelist,
            "scanEntireUrl": this.scanEntireUrl
        };

        for(const key in keyDefaultValueObjectsToLoad) {
            try{
                this.#storageHandler.getAndCreateChromeStorageIfNull(key, keyDefaultValueObjectsToLoad[key], "sync", (result) => {
                    if(key === "blockerEnabled") {
                        this.changeBlockingEnabled(result);
                    }
                    else if(key === "blockedWebsites") {
                        this.changeBlocklist(result);
                    }
                    else if(key === "whitelistedWebsites") {
                        this.changeWhitelist(result);
                    }
                    else if(key === "scanEntireUrl") {
                        this.changeScanEntireUrl(result);
                    }
                });
            }catch(err){
                console.error("Error updating DOM: ", err)
            }
        }
    }

    #addChangeEventHandlers() {
        this.#storageEventHandler();
        this.#DOMChangeEventHandler();
    }

    #storageEventHandler() {
        this.#storageHandler.addChangeListener("blockerEnabled", "sync", (newValue) => {
            this.changeBlockingEnabled(newValue);
        });
        
        this.#storageHandler.addChangeListener("blockedWebsites", "sync", (newValue) => {
            this.changeBlocklist(newValue);
        })

        this.#storageHandler.addChangeListener("whitelistedWebsites", "sync", (newValue) => {
            this.changeWhitelist(newValue);
        })

        this.#storageHandler.addChangeListener("scanEntireUrl", "sync", (newValue) => {
            this.changeScanEntireUrl(newValue);
        });

    }

    #DOMChangeEventHandler() {
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
                this.#storageHandler.updateChromeStorage({"blockerEnabled": true}, "sync", (result) => {
                    console.log("Blocker enabled: ",  result)
                }) //update chrome storage
                this.blockingEnabled = true; //update class variable
                this.enableBlockingCheckbox.checked = true; //update DOM
                this.setBlockerBadgeEnabled(true); //update badge
            }else if(status === false){
                this.#storageHandler.updateChromeStorage({"blockerEnabled": false}, "sync", (result) => {
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
            if(blocklist.length === 0) {
                return;
            }
            this.#storageHandler.updateChromeStorage({"blockedWebsites": blocklist}, "sync", (result) => {
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
            this.#storageHandler.updateChromeStorage({"whitelistedWebsites": whitelist}, "sync", (result) => {
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
                this.#storageHandler.updateChromeStorage({"scanEntireUrl": true}, "sync", (result) => {
                    console.log("Scan entire URL enabled: ", result);
                }); //update chrome storage
                this.scanEntireUrl = true; //update class variable
                this.scanEntireUrlCheckbox.checked = true; //update DOM
            }else if(status === false){
                this.#storageHandler.updateChromeStorage({"scanEntireUrl": false}, "sync", (result) => {
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

    saveBlocklist() {
        const blocked = this.blockedWebsitesTextArea.value.split("\n").map(s => s.trim()).filter(Boolean);
        this.#storageHandler.updateChromeStorage({ "blockedWebsites": blocked }, "sync", (result) => {
            console.log(result);
        });
        saveBlocklistToFirestore(blocked)
    }
}

class StatisticTracker extends OptionsPageModule {
    //DOM elements
    enableStatTrackingCheckbox;
    //Class variables
    trackingActive;
    //Other
    #storageHandler;

    constructor(
        enableStatTrackingCheckbox
    ) {
        super();
        this.enableStatTrackingCheckbox = enableStatTrackingCheckbox;

        this.trackingActive = false;

        this.#storageHandler = new ChromeStorageHandler();
        this.#onLoad()
    } 

    #onLoad() { //runs when DOM is loaded
        window.addEventListener("DOMContentLoaded", () => {
            this.updateDOM();
            this.#addChangeEventHandlers(); //add event handlers after DOM is loaded
        })
    }

    updateDOM() { //loads data from chrome storage and updates DOM
        const keyDefaultValueObjectsToLoad = {
            "statisticsTrackingEnabled": this.trackingActive
        };
        for(const key in keyDefaultValueObjectsToLoad) {
            this.#storageHandler.getAndCreateChromeStorageIfNull(key, keyDefaultValueObjectsToLoad[key], "sync", (result) => {
                if(key === "statisticsTrackingEnabled") {
                    this.changeTrackingEnabled(result);
                }
            })
        }
    }

    #addChangeEventHandlers() { //adds both storage and DOM event handlers
        this.#storageEventHandler();
        this.#DOMChangeEventHandler();
    }

    #storageEventHandler() { //anything pertaining to chrome storage changes
        this.#storageHandler.addChangeListener("statisticsTrackingEnabled", "sync", (newValue) => {
            this.changeTrackingEnabled(newValue);
        });
    }

    #DOMChangeEventHandler() { //anything pertaining to DOM changes, e.g. button clicks
        this.enableStatTrackingCheckbox.addEventListener("change", () => {
            this.changeTrackingEnabled(this.enableStatTrackingCheckbox.checked)
        })
    }

    changeTrackingEnabled(status) {
        try{
            if(status){
                this.#storageHandler.updateChromeStorage({"statisticsTrackingEnabled": true}, "sync", (result) => {
                    console.log("Tracking enabled: ", result);
                }); //update chrome storage
                this.trackingActive = true; //update class variable
                this.enableStatTrackingCheckbox.checked = true; //update DOM
            }else if(status === false){
                this.#storageHandler.updateChromeStorage({"statisticsTrackingEnabled": false}, "sync", (result) => {
                    console.log("Tracking disabled: ", result);
                }); //update chrome storage
                this.trackingActive = false; //update class variable
                this.enableStatTrackingCheckbox.checked = false; //update DOM
            }
        }catch(err){
            console.error("Error changing tracking enabled status: ", err)
        }
    }
}

class HomepageSettings extends OptionsPageModule{
    //DOM elements
    openKlausOnNewTabCheckbox;
    homepageMessageTextArea;
    saveHomepageMessageButton;
    homepageColorPicker;
    saveHomepageColorButton;
    //Class variables
    homepageConfig;
    //Other
    #storageHandler;

    constructor(
        //insert all DOM elements here
        openKlausOnNewTabCheckbox,
        homepageMessageTextArea,
        saveHomepageMessageButton,
        homepageColorPicker,
        saveHomepageColorButton
    ) {
        super();
        this.openKlausOnNewTabCheckbox = openKlausOnNewTabCheckbox;
        this.homepageMessageTextArea = homepageMessageTextArea;
        this.saveHomepageMessageButton = saveHomepageMessageButton;
        this.homepageColorPicker = homepageColorPicker;
        this.saveHomepageColorButton = saveHomepageColorButton;
        
        this.homepageConfig = {
            "openKlausOnNewTab": true,
            "homepageWelcomeMessage": "Welcome to Klaus!",
            "homepageBackgroundColor": "#ffffff"
        }

        this.#storageHandler = new ChromeStorageHandler();
        this.#onLoad();
    } 

    #onLoad() { //runs when DOM is loaded
        window.addEventListener("DOMContentLoaded", () => {
            this.updateDOM()
            this.#addChangeEventHandlers();
        });
    }

    updateDOM() { //loads data from chrome storage and updates DOM
        const config = {"homepageConfig": this.homepageConfig};

        try{
            this.#storageHandler.getAndCreateChromeStorageIfNull("homepageConfig", config["homepageConfig"], "sync", (result) => {
                for(const key in config["homepageConfig"]){
                    if(key === "homepageConfig") {
                        if(key === "openKlausOnNewTab"){
                            this.changeOpenKlausOnNewTab(result);
                        }else if(key === "homepageWelcomeMessage") {
                            this.changeHomepageMessage(result);
                        }else if(key === "homepageBackgroundColor") {
                            this.changeHomepageBackgroundColor(result);
                        }
                    }
                }
            })
        }catch(err){
            console.error("Error updating DOM: ", err)
        }
    }

    #addChangeEventHandlers() { //adds both storage and DOM event handlers
        this.#storageEventHandler();
        this.#DOMChangeEventHandler();
    }

    #storageEventHandler() { //anything pertaining to chrome storage changes
        this.#storageHandler.addChangeListener(this.homepageConfig["openKlausOnNewTab"], "sync", (newValue) => {
            this.changeOpenKlausOnNewTab(newValue);
        });
        this.#storageHandler.addChangeListener(this.homepageConfig["welcomeMessage"], "sync", (newValue) => {
            this.changeHomepageMessage(newValue);
        });
        this.#storageHandler.addChangeListener(this.homepageConfig["homepageBackgroundColor"], "sync", (newValue) => {
            this.changeHomepageBackgroundColor(newValue);
        });

        // this.#storageHandler.addChangeListener(homepageConfig, "sync", (newValue) => {
        //     this.changeOpenKlausOnNewTab(newValue["openKlausOnNewTab"]);
        //     this.changeHomepageMessage(newValue["welcomeMessage"]);
        //     this.changeHomepageBackgroundColor(newValue["homepageBackgroundColor"]);
        // })
    }

    #DOMChangeEventHandler() { //anything pertaining to DOM changes, e.g. button clicks
        this.openKlausOnNewTabCheckbox.addEventListener("change", () => {
            this.changeOpenKlausOnNewTab(this.openKlausOnNewTabCheckbox.checked)
        })

        this.homepageMessageTextArea.addEventListener("change", () => {
            this.changeHomepageMessage(this.homepageMessageTextArea.value)
        })

        this.saveHomepageMessageButton.addEventListener("click", () => {
            this.changeHomepageMessage(this.homepageMessageTextArea.value)
        })

        this.saveHomepageColorButton.addEventListener("click", () => {
            this.changeHomepageBackgroundColor(this.homepageColorPicker.value)
        })
    }

    changeOpenKlausOnNewTab(status) {
        if(status){
            this.#storageHandler.updateChromeStorage({"homepageConfig": {...this.homepageConfig, "openKlausOnNewTab" : true}}, "sync", (result) => {
                console.log("Open Klaus on new tab enabled: ", result);
            }); //update chrome storage
            this.homepageConfig["openKlausOnNewTab"] = true; //update class variable
            this.openKlausOnNewTabCheckbox.checked = true; //update DOM
        }else if(status === false){
            this.#storageHandler.updateChromeStorage({"homepageConfig": {...this.homepageConfig, "openKlausOnNewTab" : false}}, "sync", (result) => {
                console.log("Open Klaus on new tab disabled: ", result);
            }); //update chrome storage
            this.homepageConfig["openKlausOnNewTab"] = false; //update class variable
            this.openKlausOnNewTabCheckbox.checked = false; //update DOM
        }
        
    }

    changeHomepageMessage(message) {
        this.#storageHandler.updateChromeStorage(
            {"homepageConfig": {...this.homepageConfig, "homepageWelcomeMessage" : message}},
            "sync", (result) => {
                console.log("Homepage message changed: ", result);
            }
        )
        updateHomepageMessage(message); //update chrome storage???
        this.homepageConfig["homepageWelcomeMessage"] = message; //update class variable
        this.homepageMessageTextArea.value = message; //update DOM
    }

    changeHomepageBackgroundColor(color) {
        this.#storageHandler.updateChromeStorage(
            {"homepageConfig": {...this.homepageConfig, "homepageBackgroundColor" : color}},
            "sync", (result) => {
                console.log("Homepage color changed: ", result);
            }
        )
        this.homepageConfig["homepageBackgroundColor"] = color; //update class variable
        this.homepageColorPicker.value = color; //update DOM
        document.body.style.backgroundColor = color;
    }
}

class NativeCommunication extends OptionsPageModule{
    //DOM elements
    receivedFromNativeAppTextArea;
    openNativeKlausButton;
    testButton;
    //Class variables
    receivedMessage;
    //Other
    #storageHandler;

    constructor(
        receivedFromNativeAppTextArea, 
        openNativeKlausButton,
        testButton
    ) {
        super();
        this.receivedFromNativeAppTextArea = receivedFromNativeAppTextArea;
        this.openNativeKlausButton = openNativeKlausButton;
        this.testButton = testButton;
        this.receivedMessage = "";

        this.#storageHandler = new ChromeStorageHandler();
        this.#onLoad();
        this.#addChangeEventHandlers();
    }

    #onLoad() {
        window.addEventListener("DOMContentLoaded", () => {
            this.updateDOM()
            this.refreshBlocklistFromNative();
        });
    }

    updateDOM() {
        const keyDefaultValueObjectsToLoad = {
            "receivedTextFromNativeApp": this.receivedMessage,
        };

        for(const key in keyDefaultValueObjectsToLoad) {
            try{
                this.#storageHandler.getAndCreateChromeStorageIfNull(key, keyDefaultValueObjectsToLoad[key], "sync", (result) => {
                    if(key === "receivedTextFromNativeApp") {
                        this.updateReceivedTextFromNativeApp(result.receivedTextFromNativeApp)
                    }
                });
            }catch(err){
                console.error("Error updating DOM: ", err)
            }
        }
    }

    #addChangeEventHandlers() {
        this.#storageEventHandler();
        this.#DOMChangeEventHandler();
    }

    #storageEventHandler() {
        this.#storageHandler.addChangeListener("receivedTextFromNativeApp", "sync", (newValue) => {
            this.updateReceivedTextFromNativeApp(newValue);
        });
    }

    #DOMChangeEventHandler() {
        this.openNativeKlausButton.addEventListener("click", () => {
            this.openNativeKlaus();
        });

        this.testButton.addEventListener("click", () => {
            this.testEvent();
        });
    }

    updateReceivedTextFromNativeApp(storageData) {
        try{
            const message = storageData.receivedTextFromNativeApp;
            if (message) {
                this.#storageHandler.updateChromeStorage({ "receivedTextFromNativeApp": message }, "sync", (result) => {
                    console.log("Received text from native app updated: ", result);
                }); //update chrome storage
                this.receivedMessage = message; //update class variable
                this.receivedFromNativeAppTextArea.value = message; //update DOM
            } else {
                this.#storageHandler.updateChromeStorage({ receivedTextFromNativeApp: "" }, "sync", (result) => {
                    console.log("receivedTextFromNativeApp reset to empty string", result);
                }); //update chrome storage
                this.receivedMessage = ""; //update class variable
                this.receivedFromNativeAppTextArea.value = ""; //update DOM
            }
        }catch(err){
            console.error("Error updating received text from native app: ", err)
        }
    }

    sendMessageToNative(message) {
        this.#sendActionMessageToBackground('sendToNative', message)
    }

    refreshBlocklistFromNative() {
        this.#sendActionMessageToBackground('refreshBlocklistFromNative', '')
    }

    openNativeKlaus() {
        this.#sendActionMessageToBackground('openNative', '')
    }

    testEvent() {
        console.log("Sending:  hello");
        this.sendMessageToNative("hello")
    }

    // 1. Send an action message to the background  
    async #sendActionMessageToBackground(action, message) {
        const object = { action: action, message: message }
        await chrome.runtime.sendMessage(object).then((response) =>
            console.log(response)
        )
    }
}

main();