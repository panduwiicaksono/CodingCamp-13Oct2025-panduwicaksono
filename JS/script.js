// State management
let todos = JSON.parse(localStorage.getItem('todos')) || [];
let currentSearch = '';
let currentFilter = 'all';
let currentSort = 'newest';

// DOM Elements
const todoInput = document.getElementById('todo-input');
const dateInput = document.getElementById('date-input');
const addButton = document.getElementById('add-button');
const taskList = document.getElementById('task-list');
const searchInput = document.getElementById('search-input');
const filterSelect = document.getElementById('filter-select');
const sortSelect = document.getElementById('sort-select');
const clearCompletedButton = document.getElementById('clear-completed');
const clearAllButton = document.getElementById('clear-all');
const emptyState = document.getElementById('empty-state');

// Event Listeners
document.addEventListener('DOMContentLoaded', initApp);
addButton.addEventListener('click', addTask);
todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
});
searchInput.addEventListener('input', applySearch);
filterSelect.addEventListener('change', applyFilter);
sortSelect.addEventListener('change', applySort);
clearCompletedButton.addEventListener('click', clearCompleted);
clearAllButton.addEventListener('click', clearAll);

// Initialize the application
function initApp() {
    renderTodos();
    updateEmptyState();
}

// Add a new task
function addTask() {
    const text = todoInput.value.trim();
    const dueDate = dateInput.value;
    
    if (!text) {
        alert('Please enter a task!');
        todoInput.focus();
        return;
    }
    
    if (!dueDate) {
        alert('Please select a due date!');
        dateInput.focus();
        return;
    }
    
    const newTodo = {
        id: Date.now(),
        text: text,
        completed: false,
        dueDate: dueDate,
        createdAt: new Date().toISOString()
    };
    
    todos.push(newTodo);
    saveTodos();
    renderTodos();
    updateEmptyState();
    
    // Reset input fields
    todoInput.value = '';
    dateInput.value = '';
    todoInput.focus();
}

// Render todos to the DOM
function renderTodos() {
    // Apply search, filter and sort
    let filteredTodos = [...todos];
    
    // Apply search
    if (currentSearch) {
        filteredTodos = filteredTodos.filter(todo => 
            todo.text.toLowerCase().includes(currentSearch.toLowerCase())
        );
    }
    
    // Apply filter
    filteredTodos = applyStatusFilter(filteredTodos);
    
    // Apply sort
    filteredTodos = sortTodos(filteredTodos);
    
    // Clear the task list
    taskList.innerHTML = '';
    
    // Render each todo
    filteredTodos.forEach(todo => {
        const todoItem = createTodoElement(todo);
        taskList.appendChild(todoItem);
    });
}

// Apply status filter
function applyStatusFilter(todos) {
    switch (currentFilter) {
        case 'completed':
            return todos.filter(todo => todo.completed);
        case 'active':
            return todos.filter(todo => !todo.completed && !isOverdue(todo.dueDate));
        case 'overdue':
            return todos.filter(todo => !todo.completed && isOverdue(todo.dueDate));
        case 'all':
        default:
            return todos;
    }
}

// Sort todos based on selected criteria
function sortTodos(todos) {
    switch (currentSort) {
        case 'newest':
            return todos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        case 'oldest':
            return todos.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        case 'alphabetical':
            return todos.sort((a, b) => a.text.localeCompare(b.text));
        case 'dueDate':
            return todos.sort((a, b) => {
                if (!a.dueDate && !b.dueDate) return 0;
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate) - new Date(b.dueDate);
            });
        default:
            return todos;
    }
}

// Create a todo element
function createTodoElement(todo) {
    const li = document.createElement('li');
    
    // Determine status and apply appropriate styling
    let statusClass = 'bg-white border-gray-200';
    let textClass = 'text-gray-800';
    let dateClass = 'text-gray-500';
    
    if (todo.completed) {
        // Completed - Green
        statusClass = 'bg-green-50 border-green-200';
        textClass = 'text-green-700 line-through';
        dateClass = 'text-green-500';
    } else if (isOverdue(todo.dueDate)) {
        // Overdue - Red
        statusClass = 'bg-red-50 border-red-200';
        textClass = 'text-red-700';
        dateClass = 'text-red-500';
    }
    
    li.className = `flex items-center justify-between p-3 border rounded-lg ${statusClass}`;
    li.setAttribute('data-id', todo.id);
    
    // Left section - Checkbox and content
    const leftSection = document.createElement('div');
    leftSection.className = 'flex items-center space-x-3 flex-grow';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.completed;
    checkbox.className = 'h-5 w-5';
    checkbox.addEventListener('change', () => toggleComplete(todo.id));
    
    // Apply checkbox color based on status
    if (todo.completed) {
        checkbox.className += ' text-green-600';
    } else if (isOverdue(todo.dueDate)) {
        checkbox.className += ' text-red-600';
    } else {
        checkbox.className += ' text-blue-600';
    }
    
    const contentSection = document.createElement('div');
    contentSection.className = 'flex flex-col';
    
    const textSpan = document.createElement('span');
    textSpan.className = `${textClass} font-medium`;
    textSpan.textContent = todo.text;
    
    const dateSpan = document.createElement('span');
    dateSpan.className = `text-sm ${dateClass}`;
    
    let dateText = `Due: ${formatDate(todo.dueDate)}`;
    if (isOverdue(todo.dueDate) && !todo.completed) {
        dateText += ' ⚠️ Overdue';
    } else if (todo.completed) {
        dateText += ' ✓ Completed';
    }
    
    dateSpan.textContent = dateText;
    
    contentSection.appendChild(textSpan);
    contentSection.appendChild(dateSpan);
    
    leftSection.appendChild(checkbox);
    leftSection.appendChild(contentSection);
    
    // Right section - Action buttons
    const rightSection = document.createElement('div');
    rightSection.className = 'flex space-x-2';
    
    const editButton = document.createElement('button');
    editButton.className = 'bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600';
    editButton.textContent = 'Edit';
    editButton.addEventListener('click', () => editTask(todo.id));
    
    const deleteButton = document.createElement('button');
    deleteButton.className = 'bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => deleteTask(todo.id));
    
    rightSection.appendChild(editButton);
    rightSection.appendChild(deleteButton);
    
    li.appendChild(leftSection);
    li.appendChild(rightSection);
    
    return li;
}

// Check if a task is overdue
function isOverdue(dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    return due < today;
}

// Toggle complete status
function toggleComplete(id) {
    todos = todos.map(todo => 
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    saveTodos();
    renderTodos();
}

// Edit a task (text and date)
function editTask(id) {
    const todo = todos.find(todo => todo.id === id);
    if (!todo) return;
    
    const newText = prompt('Edit your task:', todo.text);
    if (newText === null) return; // User cancelled
    
    if (newText.trim() === '') {
        alert('Task text cannot be empty!');
        return;
    }
    
    // Ask for new date
    const newDate = prompt('Edit due date (YYYY-MM-DD):', todo.dueDate);
    if (newDate === null) return; // User cancelled
    
    if (!newDate) {
        alert('Due date cannot be empty!');
        return;
    }
    
    // Validate date format
    if (!isValidDate(newDate)) {
        alert('Please enter a valid date in YYYY-MM-DD format!');
        return;
    }
    
    // Update todo
    todo.text = newText.trim();
    todo.dueDate = newDate;
    saveTodos();
    renderTodos();
}

// Delete a task
function deleteTask(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        todos = todos.filter(todo => todo.id !== id);
        saveTodos();
        renderTodos();
        updateEmptyState();
    }
}

// Clear completed tasks
function clearCompleted() {
    const completedCount = todos.filter(todo => todo.completed).length;
    if (completedCount === 0) {
        alert('No completed tasks to clear!');
        return;
    }
    
    if (confirm(`Are you sure you want to delete ${completedCount} completed task(s)?`)) {
        todos = todos.filter(todo => !todo.completed);
        saveTodos();
        renderTodos();
        updateEmptyState();
    }
}

// Clear all tasks
function clearAll() {
    if (todos.length === 0) {
        alert('No tasks to clear!');
        return;
    }
    
    if (confirm('Are you sure you want to delete ALL tasks?')) {
        todos = [];
        saveTodos();
        renderTodos();
        updateEmptyState();
    }
}

// Apply search
function applySearch() {
    currentSearch = searchInput.value;
    renderTodos();
}

// Apply filter
function applyFilter() {
    currentFilter = filterSelect.value;
    renderTodos();
}

// Apply sort
function applySort() {
    currentSort = sortSelect.value;
    renderTodos();
}

// Format date for display
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Validate date format
function isValidDate(dateString) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
}

// Update empty state visibility
function updateEmptyState() {
    if (todos.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
    }
}

// Save todos to localStorage
function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}