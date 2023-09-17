const homepageConfig = {};
homepageConfig.homepageWelcomeMessage = "Welcome to Klaus!";

async function updateHomepageConfig(propertyName, newValue) {
    try{
        homepageConfig[propertyName] = newValue;
        await chrome.storage.local.set({homepageConfig: homepageConfig});
        console.log("Homepage config updated")
    }catch(err){
        console.log(err);
    }
}

async function getHomepageConfig() {
    try{
        const config = await chrome.storage.local.get('homepageConfig');
        return config.homepageConfig;
    }catch(err){
        console.log(err);
    }
}

async function updateHomepageMessage(element, message) {
    try{
        await updateHomepageConfig("homepageWelcomeMessage", message);
        const config = await getHomepageConfig();
        element.textContent = config.homepageWelcomeMessage;
    }catch(err){
        console.log(err);
    }
}

export {
    updateHomepageMessage
}