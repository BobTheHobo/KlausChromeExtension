const textarea = document.getElementById("blockedtextarea");
const saveButton = document.getElementById("saveButton");
const enableCheckbox = document.getElementById("enableCheckbox");
const urlOptionChekbox = document.getElementById("urlOptionCheckbox");
const openFilesButton = document.getElementById("openFiles");
const testButton = document.getElementById("testButton");
const receivedtextarea = document.getElementById("receivedTextArea");
const openKlausButton = document.getElementById("openKlausButton")

main()

function main() {
    refreshBlocklist(); //updates blocklist when the options popup/page is opened
}

// 1. Send a message to the background
async function sendMessageToBackground(action, message) {
    const object = { action: action, message: message }
    await chrome.runtime.sendMessage(object).then((response) =>
        console.log(response)
    )
}

function sendNativeMessage(message) {
    sendMessageToBackground('sendToNative', message)
}

function refreshBlocklist() {
    sendMessageToBackground('refreshBlocklist', '')
}

function openNativeKlaus() {
    sendMessageToBackground('openNative', '')
}

testButton.addEventListener("click", () => {
    console.log("Sending:  hello");
    sendNativeMessage("hello")
});

openKlausButton.addEventListener("click", () => {
    openNativeKlaus()
})

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
            // console.log("Loaded blocked website list")
        } else {
            chrome.storage.sync.set({ blockedWebsites: [] });
            console.log("blockedWebsites reset to empty array");
        }

        if (data.receivedtext) {
            receivedtextarea.value = data.receivedtext;
            // console.log("Loaded received website list")
        } else {
            chrome.storage.sync.set({ receivedtext: "" });
            console.log("receivedtext reset to empty string");
        }

        if (typeof data.blockerEnabled == "boolean") {
            enableCheckbox.checked = data.blockerEnabled;
            // console.log("Loaded blocker enabled status");

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
            // console.log("Loaded URL option");
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