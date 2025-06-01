import { 
    setBlockerEnabled,
    chromeStorageUpdater,
    tabsUpdatedListener,
    tabCreatedListener,
    openOptionsPage,
    changeDataListener
} from "./extensionFunctions.js"

main()

function main() {
    //runs when extension first installed, updated, or when chrome updated
    chrome.runtime.onInstalled.addListener(onInstallAndUpdate);

    // Listen for option changes and sync here
    chrome.storage.onChanged.addListener(changeData => changeDataListener(changeData));
    
    // Listen for tab updates
    chrome.tabs.onUpdated.addListener((tabId, changeInfo) => tabsUpdatedListener(tabId, changeInfo));

    // Listen for extension button click, opens option page
    chrome.action.onClicked.addListener(openOptionsPage);

    // Listen for tab creation
    chrome.tabs.onCreated.addListener(tab => tabCreatedListener(tab))
}

function onInstallAndUpdate() {
    setBlockerEnabled(false)

    chrome.storage.sync.get(chromeSyncStorageData => chromeStorageUpdater(chromeSyncStorageData))
}