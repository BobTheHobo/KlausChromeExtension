const textarea = document.getElementById("blockedtextarea");
const saveButton = document.getElementById("saveButton");
const enableCheckbox = document.getElementById("enableCheckbox");
const urlOptionChekbox = document.getElementById("urlOptionCheckbox")
const openFilesButton = document.getElementById("openFiles");
const testButton = document.getElementById("testButton");

let port

try {
    //Everytime options.js is run, open a port
    port = chrome.runtime.connectNative("msgtest"); //change msgtest to the native app's name defined in app's json manifest

    //listens for messages from native app
    port.onMessage.addListener((response) => {
        console.log(`Received: ${response}`);
    });

} catch (e) {
    console.log("Error connecting to native port: " + e);
}

//Example for sending a message to native app
testButton.addEventListener("click", () => {
    if (port != undefined) {
        /*
        Listen for messages from the app.
        */
        console.log("Sending:  hello");
        port.postMessage("hello");
    }
});

//saves new blocklist to storage
saveButton.addEventListener("click", () => {
    const blocked = textarea.value.split("\n").map(s => s.trim()).filter(Boolean);
    chrome.storage.sync.set({ "blockedWebsites": blocked }, () => {
        alert("Blocked websites saved")
        console.log("Blocked websites saved")
    });
});

//saves enableCheckbox status to storage, changes checkbox status and badge on input
enableCheckbox.addEventListener("change", (event) => {
    const enabled = event.target.checked;
    chrome.storage.sync.set({ "blockerEnabled": enabled });

    if (enabled) {
        chrome.action.setBadgeText({
            text: "ON",
        });
    } else {
        chrome.action.setBadgeText({
            text: "OFF",
        });
    }

    console.log("Enabled turned to " + enabled)
});

//saves urlOptionCheckbox status to storage
urlOptionChekbox.addEventListener("change", (event) => {
    const scanEnabled = event.target.checked;
    chrome.storage.sync.set({ "scanEnabled": scanEnabled });
    console.log("Scan entire URL turned to " + scanEnabled)
});


//syncs data across all instances (ie popup and full tab options) of the extension when something changes 
chrome.storage.onChanged.addListener(changeData => {
    if (changeData.blockedWebsites) {
        textarea.value = changeData.blockedWebsites.newValue.join("\n");
    }

    if (changeData.blockerEnabled) {
        enableCheckbox.checked = changeData.blockerEnabled.newValue;
    }

    if (changeData.scanEnabled) {
        urlOptionChekbox.checked = changeData.scanEnabled.newValue;
    }
});

//load everything
window.addEventListener("DOMContentLoaded", () => {
    chrome.storage.sync.get(function(data) {
        if (data.blockedWebsites) {
            textarea.value = data.blockedWebsites.join("\n");
            console.log("Loaded blocked website list")
        } else {
            chrome.storage.sync.set({ blockedWebsites: [] });
            console.log("blockedWebsites reset to empty array");
        }

        if (typeof data.blockerEnabled == "boolean") {
            enableCheckbox.checked = data.blockerEnabled;
            console.log("Loaded blocker enabled status");

            if (data.blockerEnabled) {
                chrome.action.setBadgeText({
                    text: "ON",
                });
            } else {
                chrome.action.setBadgeText({
                    text: "OFF",
                });
            }

        } else {
            chrome.storage.sync.set({ blockerEnabled: false });
            console.log("blockerEnabled reset to false");
        }

        if (typeof data.scanEnabled == "boolean") {
            urlOptionChekbox.checked = data.scanEnabled;
            console.log("Loaded URL option");
        } else {
            chrome.storage.sync.set({ scanEnabled: false });
            console.log("scanEnabled reset to false");
        }
    });
});

//button event
openFilesButton.addEventListener("click", () => {
    openFile();
});

//opens file manager
async function openFile() {
    console.log('Opening file manager')
    const [fileHandle] = await window.showOpenFilePicker();

    const file = await fileHandle.getFile();
    const contents = await file.text();

    console.log(contents)
}