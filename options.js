const textarea = document.getElementById("blockedtextarea");
const saveButton = document.getElementById("saveButton");
const checkbox = document.getElementById("checkbox");

saveButton.addEventListener("click", () => {
    const blocked = textarea.value.split("\n").map(s => s.trim()).filter(Boolean);
    chrome.storage.sync.set({ "blockedWebsites": blocked }, () => {
        alert("Blocked websites saved")
        console.log("Blocked websites saved")
    });
});

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

window.addEventListener("DOMContentLoaded", () => {
    chrome.storage.sync.get(["blockedWebsites", "blockerEnabled"], function(data) {
        if (data.blockedWebsites) {
            textarea.value = data.blockedWebsites.join("\n");
        }
        if (typeof data.enabled == "boolean") {
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
        }
    });
});