function updateNewTab() {
    chrome.storage.sync.get(storage => {
        if(!storage.openKlausOnNewTab) { //if openKlausOnNewTab is false, open Google's default as the new tab
            chrome.tabs.update({ url: "chrome-search://local-ntp/local-ntp.html" }) //this is the address to Google's default new tab, taken from that one extension Google made for Star Wars wallpapers
        } 
    })
}

function addTabCreationListener() {
    chrome.tabs.onCreated.addListener(tab => {
        console.log("tab created")
        updateNewTab()  
    })
}

export { 
    addTabCreationListener
}