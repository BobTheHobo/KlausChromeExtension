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


const clock = document.getElementById('clock');
const greetingtext = document.getElementById('greetingtext');



function main() {
    const homepageMessageNameFunctionPair = [
        [
            {"none": ""},
            {"option1": {'Change message': () => homepageMessage.openTextInputEditor()}}
        ]
    ]
    const testNameFunctionPair = [
        [
            {"none": "eadf"},
            {"options1" : {'test': () => printText('test')}}
        ],
        [
            {"none": "feadf"},
            {"options2" : {'test2': () => printText('test2')}}
        ]
    ]
    const clockFunctionPair1 = [
        {"clockConfig": "format"},
        {'12': {'12hr': () => homepageClock.changeClockFormat("12", true)}},
        {'24': {'24hr': () => homepageClock.changeClockFormat("24", true)}}
    ]
    const clockFunctionPair2 = [
        {"clockConfig": "showSeconds"},
        {false: {'Hide Seconds': () => homepageClock.showSeconds(false, true)}},
        {true: {'Show Seconds': () => homepageClock.showSeconds(true, true)}}
    ]
    const clockOptionFunctionPairs = [clockFunctionPair1, clockFunctionPair2]

    // chrome.storage.onChanged.addListener((storageChangeData, type) => 
    //     storageChangeHandler(storageChangeData, type)
    // );

    // testFirestoreButton.addEventListener('click', testFirestore);
    addTodoButton.addEventListener('click', addTodoItem);
    todoListPreview.addEventListener('click', checkTodoItem);
    todoInput.addEventListener('keyup', addTodoOnEnter);
    testButton.addEventListener('click', testEvent);

    restoreTodoList();

    const homepageClock = new Clock(clock)
    const homepageMessage = new HomepageMessage(greetingtext);
    
    new Hoverable(hoverableGreeting, homepageMessageNameFunctionPair);
    new Hoverable(hoverableClock, clockOptionFunctionPairs);
    new Hoverable(hoverableDate, testNameFunctionPair);

    homepageClock.startClock();

    setInterval(updateClock, 1000);
    updateClock();
} 

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

class HomepageMessage {
    //DOM elements
    greetingTextElement
    greetingText
    //Class variables
    //Other
    #storageHandler = new ChromeStorageHandler();

    constructor(greetingTextElement) {
        this.greetingTextElement = greetingTextElement;

        this.homepageConfig = {
            "homepageBackgroundColor":"#ffffff",
            "homepageWelcomeMessage":"Welcome to Klaus!",
            "openKlausOnNewTab":true
        }
    
        this.#onLoad();
        this.#addChangeEventHandlers();
    }

    updateHomepageText(text, updateChromeStorage = false) {
        try{
            this.greetingTextElement.textContent = text; //update DOM

            if(!updateChromeStorage) { return; }
            this.#storageHandler.updateChromeStorage({"homepageConfig": {...this.homepageConfig, "homepageWelcomeMessage" : text}}, "sync", (result) => {
                console.log("Changed homepage greeting text: ", result);
            }); //update chrome storage
        }catch(err){
            console.error("Error updating homepage greeting text: ", err)
        }
    }

    openTextInputEditor() {
        this.greetingTextElement.contentEditable = true;
        this.greetingTextElement.focus();

        this.greetingTextElement.addEventListener('keyup', (event) => {
            if(event.key === 'Enter') {
                this.greetingTextElement.blur();
                event.preventDefault(); //prevents you from adding a new line
            }
        });
        this.greetingTextElement.addEventListener('blur', () => {
            this.updateHomepageText(this.greetingTextElement.textContent, true);
            this.greetingTextElement.contentEditable = false;
        })
    }


    #onLoad() {
        document.addEventListener("DOMContentLoaded", () => {
            this.updateDOM()
        });
    }

    updateDOM() {
        const config = this.homepageConfig;
        try{
            this.#storageHandler.getAndCreateChromeStorageIfNull("homepageConfig", config, "sync", (result) => {
                this.prevConfig = {...result};
                for(const key in result) {
                    const val = result[key.toString()];
                    if(key === "homepageWelcomeMessage") {  
                        this.updateHomepageText(val)
                    }
                }
            })
        }catch(err){
            console.error("Error updating homepage greeting DOM: ", err)
        }
    }

    #addChangeEventHandlers() {
        this.#storageEventHandler();
    }

    #storageEventHandler() {
        this.prevConfig = {...this.homepageConfig};
        console.log(this.prevConfig)
        this.#storageHandler.addChangeListener("homepageConfig", "sync", (newValue) => {
            const diff = this.findDifferentKey(newValue, this.prevConfig);
            if(diff === "homepageWelcomeMessage") {
                this.updateHomepageText(newValue["homepageWelcomeMessage"]);
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
}

class Clock {
    //DOM elements
    clockElement
    //Class variables
    clockConfig
    timeString
    //Other
    #storageHandler = new ChromeStorageHandler();

    constructor(clock) {
        this.clockElement = clock;
        this.clockConfig = {
            format: "24",
            showSeconds: true
        };
        this.timeString = ``; 
    
        this.#onLoad();
        this.#addChangeEventHandlers();

    }

    #onLoad() {
        document.addEventListener("DOMContentLoaded", () => {
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
        setInterval(()=>{this.updateTime()}, 1000);
        this.updateTime();
    }

    updateTime() {
        const now = new Date();
        let ampm = "";
        let hours = now.getHours()
        if(this.clockConfig.format === "12") {
            ampm = hours >= 12 ? 'PM' : 'AM';
            hours = (now.getHours() % 12 || 12)
        }
        hours = hours.toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        let seconds = ":"+now.getSeconds().toString().padStart(2, '0');
        if(this.clockConfig.showSeconds === false) {
            seconds = "";
        }

        this.timeString = `${hours}:${minutes}${seconds} ${ampm}`
        // document.getElementById('clock').textContent = timeString;
        this.clockElement.textContent = this.timeString;
    }

    changeClockFormat(format, updateChromeStorage = false) {
        try{
            if(format === "24") {
                this.clockConfig["format"] = "24";
                this.updateTime();

                if(!updateChromeStorage) { return; }
                this.#storageHandler.updateChromeStorage({"clockConfig": this.clockConfig}, "sync", (result) => {
                    console.log("Changed clock format to 24hr: ", result);
                }); //update chrome storage
            }else if(format === "12") {
                this.clockConfig["format"] = "12";
                this.updateTime();
                
                if(!updateChromeStorage) { return; }
                this.#storageHandler.updateChromeStorage({"clockConfig": this.clockConfig}, "sync", (result) => {
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
                this.updateTime();

                if(!updateChromeStorage) { return; }
                this.#storageHandler.updateChromeStorage(
                    {"clockConfig": {...this.clockConfig, "showSeconds" : true}},
                    "sync", (result) => {
                        console.log("Show seconds turned on: ", result);
                    }
                )
            }else{
                this.clockConfig["showSeconds"] = false;
                this.updateTime();

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
    constructor(element, optionNameFunctionPairs) {
        this.element = element;
        this.childFlyoutButton = this.createChildFlyoutButton(optionNameFunctionPairs); //creates flyoutButton on instantiation
        this.optionNameFunctionPairs = optionNameFunctionPairs;
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

    createChildFlyoutButton(optionNameFunctionPairs) {
        return new FlyoutButton(this.element, optionNameFunctionPairs);
    }
}

class FlyoutButton {
    constructor(parent, optionNameFunctionPairs) {
        this.parentHoverable = parent;
        this.optionNameFunctionPairs = optionNameFunctionPairs;
        [this.flyoutButton, this.rotateSpan] = this.createFlyoutButton();
        this.childOptionDropdown = this.createChildOptionDropdown(optionNameFunctionPairs); //creates optionDropdown on instantiation
        this.opened = false;
    }

    closeFlyoutAndDropdown() {
        this.childOptionDropdown.removeOptionDropdown();
        this.keepFlyoutOpen(false);
        this.rotateTransition(false);
        this.opened.false;
    }

    openFlyoutAndDropdown() {
        this.childOptionDropdown.createOptionDropdown(this.optionNameFunctionPairs);
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
        this.optionDropdownList = document.createElement('ul');
        this.toggleableOptions = this.createToggleableOptions(this.optionDropdownList, this.optionNameFunctionPairs);
    }

    createOptionDropdown(optionNameFunctionPairs) {
        const dropdownContainer = document.createElement('span')
        dropdownContainer.className = 'option-dropdown-container';

        this.optionDropdownList.className = 'option-dropdown-list';
        
        dropdownContainer.appendChild(this.optionDropdownList);
        this.parentFlyoutButton.appendChild(dropdownContainer);
        
        dropdownContainer.offsetWidth; //forces reflow, triggering transition  
        dropdownContainer.classList.add('option-dropdown-animation');
        this.dropdown = dropdownContainer;

        return dropdownContainer;
    }

    removeOptionDropdown() {
        this.dropdown.remove();
    }

    createToggleableOptions(parentList, toggleableFunctionPairs) {
        for(const toggleOption of toggleableFunctionPairs) {
            const optionType = Object.keys(toggleOption[0])[0];
            if(optionType === "none") {
                new Option(parentList, toggleOption).createListElement();
            }else if(optionType === "input") {
                new OptionWithInput(parentList, toggleOption).createListElement();
            }else{
                new ToggleableOption(parentList, toggleOption).createListElement();
            }
        }
    }
}

class Option {
    constructor(parentList, functionPairsObj) {
        this.functionPairsObj = functionPairsObj;
        this.functionPairs = this.functionPairsObj.slice(1);
        
        this.parentList = parentList;
        this.currentIndex = 0;
        this.currentPair = Object.values(this.functionPairs[this.currentIndex])[0];
        this.totalFunctions = this.functionPairs.length;
        this.optionText = document.createElement('t');
    }

    executeCurrentFunction() {
        this.currentFunction();
    }

    createListElement() {
        this.currentName = Object.keys(this.currentPair)[0];
        this.currentFunction = Object.values(this.currentPair)[0];

        let option = document.createElement('li');
        option.className = 'option-dropdown-item'
        option.addEventListener('click', () => {
            this.executeCurrentFunction();
        });

        this.optionText.textContent = this.currentName;

        option.appendChild(this.optionText);
        this.parentList.appendChild(option);
    }
}

class OptionWithInput extends Option {
    constructor(parentList, functionPairsObj) {
        super(parentList, functionPairsObj);
        this.input = document.createElement('input');
    }

    executeCurrentFunction() {
        this.currentFunction();
    }

    createListElement() {
        this.currentName = Object.keys(this.currentPair)[0];
        this.currentFunction = Object.values(this.currentPair)[0];

        let option = document.createElement('li');
        option.className = 'option-dropdown-item'

        this.optionText.textContent = this.currentName;

        option.appendChild(this.optionText);
        this.parentList.appendChild(option);

        this.createInput(this.optionText)
    }

    createInput(parentElement) {
        this.input.className = 'option-dropdown-input';
        this.input.type = 'text';
        this.input.placeholder = 'Enter text here';

        parentElement.appendChild(this.input);
        this.input.focus();

        this.input.addEventListener('keyup', (event) => {
            if(event.key === 'Enter') {
                this.input.blur();
            }
        });
        this.input.addEventListener('blur', () => {
            this.executeCurrentFunction();
            parentElement.click(); //closes b/c bubbling
        });
        this.input.addEventListener('click', (event) => {
            event.stopPropagation();
        });
    }
}
        

//takes an array of function pair objects consisiting of name:function
class ToggleableOption {
    constructor(parentList, functionPairsObj) {
        this.functionPairsObj = functionPairsObj;
        this.associatedStorageConfig = this.functionPairsObj[0];
        this.associatedStorageConfigKey = Object.keys(this.associatedStorageConfig)[0]
        this.associatedStorageConfigValue = Object.values(this.associatedStorageConfig)[0]        

        this.toggleableFunctionPairs = this.functionPairsObj.slice(1);

        this.parentList = parentList;
        this.currentIndex = 0;
        this.currentPair = Object.values(this.toggleableFunctionPairs[this.currentIndex])[0];
        this.totalFunctions = this.toggleableFunctionPairs.length;
        this.optionText = document.createElement('t');

        this.storageHandler = new ChromeStorageHandler();
    }

    toggleNextOption() {
        this.currentIndex = (this.currentIndex + 1) % this.totalFunctions;
        this.updateOptionBasedOnIndex();
    }

    togglePreviousOption() {
        this.currentIndex = (this.currentIndex - 1) % this.totalFunctions;
        this.updateOptionBasedOnIndex();
    }

    updateOptionBasedOnIndex() {
        this.currentPair = Object.values(this.toggleableFunctionPairs[this.currentIndex])[0];
        this.currentFunction = Object.values(this.currentPair)[0];
        this.currentName = Object.keys(this.currentPair)[0];
        this.optionText.textContent = this.currentName;
    }

    executeCurrentFunction() {
        this.currentFunction();
    }

    createListElement() {
        this.checkStorageForCurrentOption();
        
        this.currentName = Object.keys(this.currentPair)[0];
        this.currentFunction = Object.values(this.currentPair)[0];

        let toggleableOption = document.createElement('li');
        toggleableOption.className = 'option-dropdown-item'
        toggleableOption.addEventListener('click', () => {
            this.executeCurrentFunction();
            this.toggleNextOption();
        });

        this.optionText.textContent = this.currentName;

        toggleableOption.appendChild(this.optionText);
        this.parentList.appendChild(toggleableOption);
    }

    async checkStorageForCurrentOption() {
        //check storage for current option, if it exists, set currentIndex to that index
        await this.storageHandler.getChromeStorage(this.associatedStorageConfigKey, "sync", (result) => {
            const storageValue = result[this.associatedStorageConfigKey][this.associatedStorageConfigValue]
            if(storageValue !== undefined) {
                const configValue = storageValue.toString();
                for(let i = 0; i < this.toggleableFunctionPairs.length; i++) {
                    const curObj = this.toggleableFunctionPairs[i];
                    const functionName = Object.keys(curObj)[0].toString();
                    if(functionName !== configValue) {
                        this.currentIndex = i;
                        this.updateOptionBasedOnIndex();
                        return;
                    }
                }
            }
        })
    }
}

main();