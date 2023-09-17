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


function updateClock() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}:${seconds}`;
    

    document.getElementById('clock').textContent = timeString;
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

function testEvent() {
    updateHomepageMessage('test');
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