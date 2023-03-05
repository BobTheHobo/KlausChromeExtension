let enabled = false;
let blocklist = [];

//runs when extension first installed, updated, or when chrome updated
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ "blockerEnabled": false }); //set blocklist to false when first installed
    chrome.action.setBadgeText({
        text: "OFF", //set badgetext to off
    });

    chrome.storage.sync.get(data => { //syncs blockedwebsites
        if (!Array.isArray(data.blockedWebsites)) { //if blocked websites array wonky, reset
            chrome.storage.sync.set({ blockedWebsites: [] });
            console.log("Blocked websites array reset on first runtime")
        }
        removeAllRules();
        blocklist = data.blockedWebsites;
    });

    console.log("Klaus disabled for first runtime")
});

// Listen for option changes and sync here
chrome.storage.onChanged.addListener(changeData => {
    if (changeData.blockedWebsites) {
        blocklist = changeData.blockedWebsites.newValue;
    }

    if (changeData.blockerEnabled) {
        enabled = changeData.blockerEnabled.newValue;
        if (enabled) {
            enableRuleset(true);
        } else {
            enableRuleset(false);
        }
    }
});

function enableRuleset(on) {
    if (on) {
        removeAllRules();
        const newRules = [];
        blocklist.forEach((domain, index) => {
            newRules.push({
                "id": index + 1,
                "priority": 1,
                "action": { "type": "block" },
                "condition": {
                    "urlFilter": domain,
                    "resourceTypes": ["main_frame", "sub_frame",
                        "stylesheet", "script", "image", "font", "object", "xmlhttprequest", "ping", "csp_report",
                        "media", "websocket", "webtransport", "webbundle"
                    ]
                }
            });
        });
        chrome.declarativeNetRequest.updateDynamicRules({ addRules: newRules });
        logRuleset();
    } else {
        //remove all rules
        removeAllRules();
        logRuleset();
    }

}

function logRuleset() {
    chrome.declarativeNetRequest.getDynamicRules((rules) => {
        console.log(rules);
    });
}

function removeAllRules() {
    chrome.declarativeNetRequest.getDynamicRules((rules) => {
        const ruleIds = rules.map(rule => rule.id);
        chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: ruleIds
        })
    });
}



//update static rulesets
// function enableRuleset(on = false) {
//     if (on) {
//         chrome.declarativeNetRequest.updateEnabledRulesets({
//             disableRulesetIds: [],
//             enableRulesetIds: ["ruleset_1"]
//         });
//     } else {
//         chrome.declarativeNetRequest.updateEnabledRulesets({
//             disableRulesetIds: ["ruleset_1"],
//             enableRulesetIds: []
//         });
//     }
// }