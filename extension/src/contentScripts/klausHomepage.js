require('../css/klausHomepage.css')

import { testFirestore } from '../backgroundScripts/firebaseFunctions.js';

import { updateHomepageMessage } from '../backgroundScripts/extensionConfig.js';

const testFirestoreButton = document.getElementById('testFirestoreButton');
const addTodoButton = document.getElementById('todoadderbutton');
const todoListPreview = document.getElementById('todopreviewlist');
const todoInput = document.getElementById('todoadderinput');
const testButton = document.getElementById('testButton');
const hoverableClock = document.getElementById('hoverable-clock');
const hoverableGreeting = document.getElementById('hoverable-greeting');
const hoverableDate = document.getElementById('hoverable-date');
const testNameFunctionPair = {'test': () => printText('test'), 'test2': () => printText('test2')}

const clock = document.getElementById('clock');

main()

function main() {
    chrome.storage.onChanged.addListener((storageChangeData, type) => 
        storageChangeHandler(storageChangeData, type)
    );

    window.addEventListener("DOMContentLoaded", () => {

        // testFirestoreButton.addEventListener('click', testFirestore);
        addTodoButton.addEventListener('click', addTodoItem);
        todoListPreview.addEventListener('click', checkTodoItem);
        todoInput.addEventListener('keyup', addTodoOnEnter);
        testButton.addEventListener('click', testEvent);

        restoreTodoList();
        loadHomepageConfig();

        new Hoverable(hoverableGreeting);
        new Hoverable(hoverableClock);
        new Hoverable(hoverableDate);

        new Clock(clock).startClock();

        setInterval(updateClock, 1000);
        updateClock();
    });
} 

function updateHomepageText(text) {
    greetingtext.textContent = text;
}

function loadHomepageConfig() {
    chrome.storage.sync.get("homepageConfig", config => {
        updateHomepageText(config.homepageConfig.homepageWelcomeMessage)
    })
}

// function updateTime() {
//     const now = new Date();
//     const hours = now.getHours().toString().padStart(2, '0');
//     const minutes = now.getMinutes().toString().padStart(2, '0');
//     const seconds = now.getSeconds().toString().padStart(2, '0');
//     const timeString = `${hours}:${minutes}:${seconds}`;
    
//     document.getElementById('clock').textContent = timeString;
// }

function updateDate() {
    const now = new Date();
    const day = now.getDate().toString().padStart(2,"0");
    const month = now.getMonth().toString().padStart(2,"0");
    const year = now.getFullYear().toString().padStart(4,"0");
    const dayOfWeekStrings = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    const dayOfWeek = dayOfWeekStrings[now.getDay()];

    const dateString = `${dayOfWeek} ${month}/${day}/${year}`;

    document.getElementById('date').textContent = dateString;
}

function updateClock() {
    // updateTime();
    updateDate();
}

function addTodoItem() {
    var todoText = document.getElementById("todoadderinput").value;

    if (todoText === '') {
        return; 
    }

    createTodoItem(todoText);

    //Save to storage
    saveTodoItemToStorage(todoText);

    //Resets input field
    document.getElementById("todoadderinput").value = "";
}

class todoItem {
    constructor(text) {
        this.createdTime = new Date();
        this.modifiedTime = new Date();

        this.deadline = null;
        this.scheduled = false;
        this.priority = 0;
        this.tags = [];

        this.recurring = false;
        this.recurringInterval = null;
        this.recurringEnd = null;
        this.recurringCount = null;
        this.recurringLast = null;
        this.recurringNext = null;
        this.recurringDone = false;

        this.text = text;
        this.checked = false;
        this.archived = false;
    }

    
}

function createTodoItem(todoText) {
    //Generates list item
    const todoItem = document.createElement('li');
    const text = document.createTextNode(todoText);
    //Generates delete button
    const deleteButton = document.createElement('button');
    const deleteButtonText = document.createTextNode('X');
    deleteButton.className = 'deletebutton';
    deleteButton.appendChild(deleteButtonText);
    deleteButton.addEventListener('click', deleteTodoItem);
    //Generates check button
    const checkButton = document.createElement('button');
    const checkButtonText = document.createTextNode('\u2713');
    checkButton.className = 'checkbutton';
    checkButton.appendChild(checkButtonText);
    //note that the checkButton event listener isn't added here,
    //but in the main function, so that it can be applied to the entire list

    //Combine everything into list item
    todoItem.appendChild(text);
    todoItem.appendChild(checkButton);
    todoItem.appendChild(deleteButton);
    //Appends to list
    todoListPreview.appendChild(todoItem);
}

function deleteTodoItem() {
    const div = this.parentElement;
    div.style.display = 'none';
    chrome.storage.local.get("todolist", result => {
        var todolist = result.todolist || [];
        todolist.splice(todolist.indexOf(div.textContent), 1);
        chrome.storage.local.set({"todolist": todolist}).then(() => {
            console.log('todolist item removed: ' + div.textContent);
        })
    })
}

function checkTodoItem(event) {
    //for individual items
    if (event.target.className === 'checkbutton') {
        event.target.parentElement.classList.toggle('checked');
    }
    //for entire list
    else if (event.target.tagName === 'LI') {
        event.target.classList.toggle('checked');
    }
}

function addTodoOnEnter(event) {
    if (event.key === 'Enter') {
        addTodoItem();
    }
}

function saveTodoItemToStorage(item) {
    chrome.storage.local.get("todolist", result => {
        var todolist = result.todolist || [];
        todolist.push(item);

        chrome.storage.local.set({"todolist": todolist}).then(() => {
            console.log('todolist item added: ' + item);
        })
    })
}

function restoreTodoList() {
    chrome.storage.local.get("todolist", result => {
        var todolist = result.todolist || [];
        todolist.forEach(item => {
            createTodoItem(item);
        });
    })
}

function printText(message) {
    console.log(message)
}

function testEvent() {
    // updateHomepageMessage('test');
    const thing = new ChromeStorageHandler();

    const clockConfig = {
        format: "12",
        showSeconds: true,
    };

    thing.updateChromeStorage({"clockConfig": clockConfig}, "sync", (result) => {
        console.log(result);
    })
    
}



function storageChangeHandler(storageChangeData, type) {
    if(type === "sync") {
        if(storageChangeData["homepageConfig"]) {
            const newObject = storageChangeData["homepageConfig"].newValue;
            console.log(newObject);
            for(const key in newObject) {
                console.log(key);
                if(key === "homepageWelcomeMessage") {
                    updateHomepageText(newObject[key]);
                }else if(key === "homepageBackgroundColor") {
                    document.body.style.backgroundColor = newObject[key];
                }
            }
        }
    }
}

class ChromeStorageHandler {
    constructor() {}

    addChangeListener(keyToListenFor, storageType, callback) {
        chrome.storage.onChanged.addListener((changes, type) => {
            if(changes[keyToListenFor]) {
                console.log(changes[keyToListenFor], " changed")
                if(type === storageType) {
                    callback(changes[keyToListenFor].newValue)
                }else{
                    console.error("Invalid storage type: ", storageType)
                }
            }
        })
    }

    updateChromeStorage(obj, storageType, callback) {
        if(storageType === "sync") {
            chrome.storage.sync.set(obj, () => {
                this.chromeStorageCallback(callback)
            });
        }
        else if(storageType === "local") {
            chrome.storage.local.set(obj, () => {
                this.chromeStorageCallback(callback)
            });
        }
        else {
            console.error("Invalid storage type: ", storageType)
            return;
        }
    }

    chromeStorageCallback(callback) {
        if(chrome.runtime.lastError) {
            console.error("Error updating chrome storage: ", chrome.runtime.lastError)
        }else{
            callback("success")
        }
    }

    async getChromeStorage(key, storageType, callback) {
        try{
            let result;
            if(storageType === "sync") {
                result = await chrome.storage.sync.get(key);
            }
            else if(storageType === "local") {
                result = await chrome.storage.local.get(key);
            }
            else{
                console.error("Invalid storage type: ", storageType)
                return;
            }

            callback(result);
        }catch(err){
            console.error("Error getting chrome storage: ", err)
        }
    }

    async getAndCreateChromeStorageIfNull(key, defaultValue, storageType, callback) {
        try{
            await this.getChromeStorage(key, storageType, (result) => {
                if(result[key] === undefined) {
                    console.log("No data found for " + key + ", creating new key")
                    this.createNewChromeStorage(key, defaultValue, storageType, (result) => {
                        console.log("   New key created: ", result);
                        callback(result[key]);
                    });
                }else{
                    callback(result[key]);
                }
            })
        }catch(err){
            console.error("Error getting and creating chrome storage: ", err)
        }
    }

    createNewChromeStorage(key, value, storageType, callback) {
        try{
            let obj = {};
            obj[key] = value;
            this.updateChromeStorage(obj, storageType, callback);
        }catch(err){
            console.error("Error when creating new chrome storage key: ", err)
            throw new Error("Uninitialized chrome storage key");
        }
    }
}


class HomepageModule {
    //DOM elements
    //Class variables
    //Other
    constructor() {

    }
}

class Clock {
    //DOM elements
    clockElement
    //Class variables
    clockConfig
    #storageHandler = new ChromeStorageHandler();

    constructor(clock) {
        this.clockElement = clock;
        this.clockConfig = {
            format: "24",
            showSeconds: true
        };
    
        this.#onLoad();
        this.#addChangeEventHandlers();
    }

    #onLoad() {
        window.addEventListener("DOMContentLoaded", () => {
            this.updateDOM()
        });
    }

    updateDOM() {
        const config = this.clockConfig;
        try{
            this.#storageHandler.getAndCreateChromeStorageIfNull("clockConfig", config, "sync", (result) => {
                this.prevConfig = {...result};
                for(const key in result) {
                    const val = result[key.toString()];
                    if(key === "format") {
                        this.changeClockFormat(val);
                    }else if(key === "showSeconds") {  
                        this.showSeconds(val);
                    }
                }
            })
        }catch(err){
            console.error("Error updating clock DOM: ", err)
        }
    }

    #addChangeEventHandlers() {
        this.#storageEventHandler();
    }

    #storageEventHandler() {
        this.prevConfig = {...this.clockConfig};
        console.log(this.prevConfig)
        this.#storageHandler.addChangeListener("clockConfig", "sync", (newValue) => {
            const diff = this.findDifferentKey(newValue, this.prevConfig);
            console.log(diff);
            if(diff === "format") {
                this.changeClockFormat(newValue["format"]);
            }else if(diff === "showSeconds") {
                this.showSeconds(newValue["showSeconds"]);
            }
            this.prevConfig = {...newValue};
        });
    }

    findDifferentKey(obj1, obj2) {
        for(const key in obj1) {
            if(obj1[key] !== obj2[key]) {
                return key;
            }
        }
        return null;
    }

    startClock() {
        setInterval(()=>{this.updateTime(this.format, this.showSeconds)}, 1000);
        this.updateTime(this.format, this.showSeconds);
    }

    updateTime(format, showSeconds) {
        this.format = format;
        this.showSeconds = showSeconds;

        const now = new Date();
        let ampm = "";
        let hours = now.getHours()
        if(this.format === "12") {
            hours = (now.getHours() % 12 || 12)
            ampm = hours >= 12 ? 'PM' : 'AM';
        }
        hours = hours.toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        let seconds = ":"+now.getSeconds().toString().padStart(2, '0');
        if(this.showSeconds === false) {
            seconds = "";
        }

        const timeString = `${hours}:${minutes}${seconds} ${ampm}`
        // document.getElementById('clock').textContent = timeString;
        this.clockElement.textContent = timeString;
    }

    changeClockFormat(format, updateChromeStorage = false) {
        try{
            if(format === "24") {
                this.clockConfig["format"] = "24";

                if(!updateChromeStorage) { return; }
                this.#storageHandler.updateChromeStorage({"format": this.clockConfig}, "sync", (result) => {
                    console.log("Changed clock format to 24hr: ", result);
                }); //update chrome storage
            }else if(format === "12") {
                this.clockConfig["format"] = "12";
                
                if(!updateChromeStorage) { return; }
                this.#storageHandler.updateChromeStorage({"format": this.clockConfig}, "sync", (result) => {
                    console.log("Changed clock format to 12hr: ", result);
                }); //update chrome storage
            }else{
                console.error("Invalid clock format: " + format);
            }
        }catch(err){
            console.error("Error changing clock format: ", err)
        }
    }

    showSeconds(show, updateChromeStorage = false) {
        try{
            if(show) {
                this.clockConfig["showSeconds"] = true;

                if(!updateChromeStorage) { return; }
                this.#storageHandler.updateChromeStorage(
                    {"clockConfig": {...this.clockConfig, "showSeconds" : true}},
                    "sync", (result) => {
                        console.log("Show seconds turned on: ", result);
                    }
                )
            }else{
                this.clockConfig["showSeconds"] = false;

                if(!updateChromeStorage) { return; }
                this.#storageHandler.updateChromeStorage(
                    {"clockConfig": {...this.clockConfig, "showSeconds" : false}},
                    "sync", (result) => {
                        console.log("Show seconds turned off: ", result);
                    }
                )
            }
        }catch(err){
            console.error("Error showing seconds: ", err)
        }
    }
}

class Homepage extends HomepageModule {
    constructor() {
        super();

    }


}

class DocumentClickListener {
    constructor(func, once=false) {
        this.functionToExecute = func || (() => {});
        this.invokedOnlyOnce = once;
        this.abortController = new AbortController();
    }

    setFunctionToExecute(func, once=false) {
        this.functionToExecute = func;
        this.invokedOnlyOnce = once;
    }

    addClickListener() {
        document.addEventListener('click', (event) => {
            this.event = event;
            this.functionToExecute();
            if (this.invokedOnlyOnce) {
                this.abortController.abort();
            }
        }, {
            signal: this.abortController.signal,
            once: this.invokedOnlyOnce
        })
    }

    abort() {
        this.abortController.abort();
    }
}


//heiarchy (parent to child): Hoverable -> FlyoutButton -> OptionDropdown
class Hoverable {
    constructor(element) {
        this.element = element;
        this.childFlyoutButton = this.createChildFlyoutButton(); //creates flyoutButton on instantiation
        this.addClickHandler();
    }

    addClickHandler() {
        this.element.addEventListener('click', () => {
            //just have flyoutbutton handle click
            this.childFlyoutButton.handleClick();
            event.stopPropagation();
        })
    }

    handleHover() {
        //on hover, just show the flyoutButton (this is handled by css)
    }

    createChildFlyoutButton() {
        return new FlyoutButton(this.element);
    }
}

class FlyoutButton {
    constructor(parent) {
        this.parentHoverable = parent;
        [this.flyoutButton, this.rotateSpan] = this.createFlyoutButton();
        this.childOptionDropdown = this.createChildOptionDropdown(testNameFunctionPair); //creates optionDropdown on instantiation
        this.opened = false;
    }

    closeFlyoutAndDropdown() {
        this.childOptionDropdown.removeOptionDropdown();
        this.keepFlyoutOpen(false);
        this.rotateTransition(false);
        this.opened.false;
    }

    openFlyoutAndDropdown() {
        this.childOptionDropdown.createOptionDropdown();
        this.keepFlyoutOpen(true);
        this.rotateTransition(true);
        this.opened = true;
    }

    handleClick() {
        const closeFlyoutAndDropdown = this.closeFlyoutAndDropdown.bind(this);
        if(this.opened) {
            this.closeFlyoutAndDropdown();
        }else{
            this.openFlyoutAndDropdown();

            const documentClickListener = new DocumentClickListener(function () {
                //on click outside, remove optionDropdown
                closeFlyoutAndDropdown();
                this.abort();
            }, true);
            documentClickListener.addClickListener();
        }
    }

    handleHover() {
        //on hover, just highlight (this is handled by css)
    }

    keepFlyoutOpen(state) {
        if(state) {
            this.flyoutButton.classList.add('keepopen');
            this.opened = true;
        }
        else if(!state){
            this.flyoutButton.classList.remove('keepopen');
            this.opened = false;
        }
    }

    rotateTransition(state) {
        if(state) {
            this.rotateSpan.classList.add('rotate-transition');
        }else{
            this.rotateSpan.classList.remove('rotate-transition');
        }
    }

    createFlyoutButton() {
        const flyoutButton = document.createElement('span');
        flyoutButton.className = 'flyout-button-container';

        const rotateSpan = document.createElement('span');
        rotateSpan.className = 'flyout-button-rotate';

        const text = document.createElement('t');
        text.className = 'option-hover-text';
        text.textContent = ">";

        rotateSpan.appendChild(text);
        flyoutButton.appendChild(rotateSpan);
        this.parentHoverable.appendChild(flyoutButton);

        return [flyoutButton, rotateSpan];
    }

    createChildOptionDropdown(optionNameFunctionPairs) {
        return new OptionDropdown(this.flyoutButton, optionNameFunctionPairs);
    }
}

class OptionDropdown {
    constructor(parent, optionNameFunctionPairs) {
        this.parentFlyoutButton = parent;
        this.dropdown = null;
        this.optionNameFunctionPairs = optionNameFunctionPairs;
    }

    createOptionDropdown() {
        const dropdownContainer = document.createElement('span')
        dropdownContainer.className = 'option-dropdown-container';

        const optionDropdownList = document.createElement('ul');
        optionDropdownList.className = 'option-dropdown-list';

        const names = Object.keys(this.optionNameFunctionPairs);
        const functions = Object.values(this.optionNameFunctionPairs);
        
        for(let i=0; i<names.length; i++) {
            let option = document.createElement('li');
            option.className = 'option-dropdown-item'
            option.addEventListener('click', ()=> {
                functions[i]();
            })

            let optionText = document.createElement('t');
            optionText.textContent = names[i];

            option.appendChild(optionText);
            optionDropdownList.appendChild(option);
        }
        dropdownContainer.appendChild(optionDropdownList);
        this.parentFlyoutButton.appendChild(dropdownContainer);
        
        dropdownContainer.offsetWidth; //forces reflow, triggering transition  
        dropdownContainer.classList.add('option-dropdown-animation');
        this.dropdown = dropdownContainer;

        return dropdownContainer;
    }

    removeOptionDropdown() {
        this.dropdown.remove();
    }
}