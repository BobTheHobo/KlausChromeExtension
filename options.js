const textarea = document.getElementById("blockedtextarea");
const saveButton = document.getElementById("saveButton");
const checkbox = document.getElementById("checkbox");
const openFilesButton = document.getElementById("openFiles");

//saves new blocklist to storage
saveButton.addEventListener("click", () => {
    const blocked = textarea.value.split("\n").map(s => s.trim()).filter(Boolean);
    chrome.storage.sync.set({ "blockedWebsites": blocked }, () => {
        alert("Blocked websites saved")
        console.log("Blocked websites saved")
    });
});

//saves checkbox status to storage, changes checkbox status and badge on input
checkbox.addEventListener("change", (event) => {
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


//syncs data across all instances (ie popup and full tab options) of the extension when something changes 
chrome.storage.onChanged.addListener(changeData => {
    chrome.storage.sync.get(["blockedWebsites", "blockerEnabled"], function(data) {
        if (data.blockedWebsites) {
            if (textarea.value != data.blockedWebsites.join("\n")) {
                textarea.value = data.blockedWebsites.join("\n");
                console.log("Sync'd blocked website list")
            }
        }

        if (typeof data.blockerEnabled == "boolean") {
            if (checkbox.checked != data.blockerEnabled) {
                checkbox.checked = data.blockerEnabled;

                if (data.blockerEnabled) {
                    chrome.action.setBadgeText({
                        text: "ON",
                    });
                } else {
                    chrome.action.setBadgeText({
                        text: "OFF",
                    });
                }

                console.log("Sync'd blocker enabled status");
            }
        }
    });
})

//load everything
window.addEventListener("DOMContentLoaded", () => {
    chrome.storage.sync.get(["blockedWebsites", "blockerEnabled"], function(data) {
        if (data.blockedWebsites) {
            textarea.value = data.blockedWebsites.join("\n");
            console.log("Loaded blocked website list")
        } else {
            chrome.storage.sync.set({ blockedWebsites: [] });
            console.log("blockedWebsites reset to empty array");
        }

        if (typeof data.blockerEnabled == "boolean") {
            checkbox.checked = data.blockerEnabled;
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
    });
});