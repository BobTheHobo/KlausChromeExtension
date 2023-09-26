const homepageConfig = {};
homepageConfig.homepageWelcomeMessage = "Welcome to Klaus!";
homepageConfig.theme = "light";
homepageConfig.background = {"color": "#fffff"};

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

async function updateHomepageMessage(message) {
    try{
        await updateHomepageConfig("homepageWelcomeMessage", message);
    }catch(err){
        console.log(err);
    }
}

async function changeTheme(theme) {
    await updateHomepageConfig("theme", theme);
    console.log("Theme changed to " + theme);
}

async function changeBackground(backgroundObject) {
    await updateHomepageConfig("background", backgroundObject);
    console.log("Background changed to " + backgroundObject);
}

export {
    updateHomepageMessage,
}