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


main()

function main() {
    chrome.storage.onChanged.addListener(storageChangeData => storageChangeHander(storageChangeData));

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

        setInterval(updateClock, 1000);
        updateClock();
    });
} 

function updateHomepageText(text) {
    greetingtext.textContent = text;
}

function loadHomepageConfig() {
    chrome.storage.local.get("homepageConfig", config => {
        updateHomepageText(config.homepageConfig.homepageWelcomeMessage)
    })
}

function updateTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}:${seconds}`;
    
    document.getElementById('clock').textContent = timeString;
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
    updateTime();
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
}

function storageChangeHander(storageChangeData) {
    if (storageChangeData.homepageConfig.newValue.homepageWelcomeMessage) {
        const newMessage = storageChangeData.homepageConfig.newValue.homepageWelcomeMessage;
        updateHomepageText(newMessage);
        console.log("Homepage message updated to " + newMessage)
    }else{
        console.log("chrome.storage changed but nothing done");
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