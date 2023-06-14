main()

function main() {

}

check
chrome.storage.sync.get("defaultnewtab", function(storage) {
    if(storage.defaultnewtab) {
        chrome.tabs.update({ url: "chrome-search://local-ntp/local-ntp.html" })
    }
    chrome.tabs.update({
        url: 'chrome-internal://newtab/'
    });
})