import { 
    requestBlocklistFromNative, 
    postToNative 
} from "./nativeCommunication.js";

function sanitizeInput(messageObject) {
    for (const key in messageObject) {
        messageObject[key] = messageObject[key].replace(/&/g, '&amp;')
        messageObject[key] = messageObject[key].replace(/</g, '&lt;')
        messageObject[key] = messageObject[key].replace(/"/g, '&quot;')
    }

    return messageObject;
}

function communicationFromOptionsScriptHandler(messageObject, sender, sendResponse) {
    //sanitize input for security
    let sanitizedMessageObject = sanitizeInput(messageObject)

    // 2. A content script sent a message, respond acknowledgement
    switch(sanitizedMessageObject.action) {
        case "refreshBlocklistFromNative":
            requestBlocklistFromNative();

            sendResponse("Website blocklist requested from Native Klaus")
            break;
        case "sendToNative":
            postToNative(sanitizedMessageObject.message)

            sendResponse("Message \"" + sanitizedMessageObject.message + "\" sent to Native Klaus")
            break;
        case "openNative":
            postToNative(OPEN_KLAUS_MESSAGE)

            sendResponse("Message to open Klaus sent to Native Klaus")
            break;
        case "sendNewBlocklist":
            postToNative()

            sendResponse("New blocklist sent to Native Klaus")
            break;
    }
}

export {
    sanitizeInput,
    communicationFromOptionsScriptHandler
}

