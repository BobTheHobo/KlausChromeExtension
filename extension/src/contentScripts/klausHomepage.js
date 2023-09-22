require('../css/klausHomepage.css')

import { testFirestore } from '../backgroundScripts/firebaseFunctions.js';

import { updateHomepageMessage } from '../backgroundScripts/extensionConfig.js';

const testFirestoreButton = document.getElementById('testFirestoreButton');
const addTodoButton = document.getElementById('todoadderbutton');
const todoListPreview = document.getElementById('todopreviewlist');
const todoInput = document.getElementById('todoadderinput');
const testButton = document.getElementById('testButton');

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
        new optionHover();

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
    new optionDropdown(this, {'test': () => printText('test'), 'test2': () => printText('test2')})
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

class addDocumentClickListener {
    constructor(func, once=false) {
        this.functionToExecute = func;
        this.invokedOnlyOnce = once;
        this.abortController = new AbortController();
        this.addClickListener();
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

class optionHover {
    constructor() {
        this.optionHovers = document.querySelectorAll('.showonhover');
        this.createOptionHovers();
    }

    createOptionHovers() {
        this.optionHovers.forEach(optionHover => {
            const rotateSpan = document.createElement('span');
            rotateSpan.className = 'click-rotate';
            const text = document.createElement('t');
            text.className = 'option-hover-text';
            text.textContent = ">";
            rotateSpan.appendChild(text);
            optionHover.appendChild(rotateSpan);
            optionHover.addEventListener('click', () => {
                this.optionHoverClickHandler(optionHover);
            })
        });
    }

    toggleKeepOptionHoverFromClosing(element) {
        element.classList.toggle('keepopen');
    }

    toggleRotate(element) {
        const rotateSpan = element.querySelector('.click-rotate')
        rotateSpan.classList.toggle('rotate');
    }

    optionHoverClickHandler(optionHover) {
        if (optionHover.classList.contains('keepopen')) {
            return;
        }
    
        new optionDropdown(optionHover, {'test': () => printText('test'), 'test2': () => printText('test2')})
        const toggleKeepFromClosing = this.toggleKeepOptionHoverFromClosing.bind(this);
        const toggleRotate = this.toggleRotate.bind(this);

        toggleKeepFromClosing(optionHover); //toggles keepopen on
        toggleRotate(optionHover);

        new addDocumentClickListener(function () {
            toggleKeepFromClosing(optionHover); //toggles keepopen off once another click is registered
            toggleRotate(optionHover);
            this.abort();
        }, 
        true); //invoked only once
    }

}

class optionDropdown {
    constructor(parent, optionNameFunctionPairs) {
        this.parent = parent;
        this.nameFunctionPairs = optionNameFunctionPairs;
        this.dropdownContainer = document.createElement('div');
        this.removeListener = new AbortController();
        this.checkIfCreated();
    }

    checkIfCreated() {
        if (this.parent.getAttribute('data-dropdown-created') === 'false' || this.parent.getAttribute('data-dropdown-created') === null) {
            this.createDropdown();
            this.addOutsideClickListener();
            event.stopPropagation();
        }
    }

    createDropdown() {
        const names = Object.keys(this.nameFunctionPairs);
        const functions = Object.values(this.nameFunctionPairs);
        
        this.dropdownContainer.className = 'option-dropdown-container';
        const optionDropdownList = document.createElement('ul');
        optionDropdownList.className = 'option-dropdown-list';
        optionDropdownList.setAttribute('data-dropdown',"true");
        
        for(let i=0; i<names.length; i++) {
            let option = document.createElement('li');
            option.className = 'option-dropdown-item'

            let optionText = document.createElement('t');
            optionText.textContent = names[i];
            option.appendChild(optionText);
            option.addEventListener('click', ()=> {
                functions[i]();
            })
            optionDropdownList.appendChild(option);
            this.dropdownContainer.appendChild(optionDropdownList)
        };

        this.parent.appendChild(this.dropdownContainer);
        this.parent.setAttribute('data-dropdown-created', 'true')
        this.dropdownContainer.offsetWidth; //forces reflow, triggering transition
        this.dropdownContainer.classList.add('option-dropdown-animation');
    }

    addOutsideClickListener() {
        const clickEval = this.clickEval.bind(this);
        this.listener = new addDocumentClickListener(function() {
            clickEval(this.event);
        })
    }

    clickEval(e) {
        if(e.target === this.dropdownContainer){
            return;
        }
        if(this.dropdownContainer.parentElement.getAttribute('data-dropdown-created')) {
            this.destroy();
        }
    }

    destroy() {
        this.dropdownContainer.remove();
        this.parent.setAttribute('data-dropdown-created', 'false')
        this.listener.abort();
    }
}