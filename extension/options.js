const textarea = document.getElementById("blockedtextarea");
const saveButton = document.getElementById("saveButton");
const enableCheckbox = document.getElementById("enableCheckbox");
const urlOptionChekbox = document.getElementById("urlOptionCheckbox");
const openFilesButton = document.getElementById("openFiles");
const testButton = document.getElementById("testButton");
const receivedtextarea = document.getElementById("receivedTextArea");

let port;
let manifestName;
let blocklist;

const REQUEST_BLOCKLIST_MESSAGE = "REQUEST_BLOCKLIST"

openNativePort();

async function openNativePort() {
    await getManifest();
    await connectToNativePort();
}

async function getManifest() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(data => {
            if (data.manifestName != undefined) {
                manifestName = data.manifestName
                resolve();
            } else {
                console.log("Error: Manifest not loaded in options")
                resolve();
            }
        });
    })
}

async function connectToNativePort() {
    return new Promise((resolve) => {
        try {
            //Everytime options.js is run, open a port
            port = chrome.runtime.connectNative(manifestName);

            port.postMessage(REQUEST_BLOCKLIST_MESSAGE)

            //listens for messages from native app
            port.onMessage.addListener((response) => {
                if (response == "COMM_MANAGER_OPENED") {
                    port.postMessage("REQUEST_BLOCKLIST")
                }

                if (response.startsWith("BLOCKLIST:")) {
                    blocklist = response.replace("BLOCKLIST:", "")
                    console.log(blocklist)
                }

                console.log(`Received: ${response}`);
                chrome.storage.sync.set({ receivedtext: response });
            });


            resolve();
        } catch (e) {
            console.log("Error connecting to native port: " + e);
            resolve();
        }
    })
}

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

    if (changeData.receivedtext) {
        receivedtextarea.value = changeData.receivedtext.newValue
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

        if (data.receivedtext) {
            receivedtextarea.value = data.receivedtext;
            console.log("Loaded received website list")
        } else {
            chrome.storage.sync.set({ receivedtext: "" });
            console.log("receivedtext reset to empty string");
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