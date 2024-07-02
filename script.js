const tasks = {
    'all-tasks': [],
    'daily-tasks': [],
    'in-progress': [],
    'completed': [],
    'favorites': []
};

// History of actions
let history = [];

// Function to add a task
function addTask(taskText, category) {
    const task = {
        text: taskText,
        category: category,
        status: category === 'daily-tasks' ? 'Yet To Start' : (category === 'completed' ? 'Completed' : 'In Progress')
    };

    tasks['all-tasks'].push(task);
    tasks[category].push(task);

    history.push({ action: 'add', task, time: new Date() });
    updateTaskList();
    updateHistoryList();
}

// Function to remove a task
function removeTask(taskText) {
    for (let category in tasks) {
        tasks[category] = tasks[category].filter(task => task.text !== taskText);
    }

    history.push({ action: 'remove', task: { text: taskText }, time: new Date() });
    updateTaskList();
    updateHistoryList();
}

// Function to complete a task
function completeTask(taskText) {
    for (let category in tasks) {
        const task = tasks[category].find(task => task.text === taskText);
        if (task) {
            task.status = 'Completed';
            tasks[category] = tasks[category].filter(t => t.text !== taskText);
            tasks['completed'].push(task);
            history.push({ action: 'complete', task: { text: taskText, status: 'Completed' }, time: new Date() });
        }
    }

    updateTaskList();
    updateHistoryList();
}

// Function to change the status of a task
function changeTaskStatus(taskText, newStatus) {
    for (let category in tasks) {
        const task = tasks[category].find(task => task.text === taskText);
        if (task) {
            const oldStatus = task.status;
            task.status = newStatus;

            if (oldStatus === 'Yet To Start' && newStatus !== 'Yet To Start') {
                tasks['daily-tasks'] = tasks['daily-tasks'].filter(t => t.text !== taskText);
                if (newStatus === 'In Progress') {
                    tasks['in-progress'].push(task);
                } else if (newStatus === 'Completed') {
                    tasks['completed'].push(task);
                }
            } else if (oldStatus === 'In Progress' && newStatus === 'Completed') {
                tasks['in-progress'] = tasks['in-progress'].filter(t => t.text !== taskText);
                tasks['completed'].push(task);
            } else if (oldStatus === 'Completed' && newStatus !== 'Completed') {
                tasks['completed'] = tasks['completed'].filter(t => t.text !== taskText);
                if (newStatus === 'In Progress') {
                    tasks['in-progress'].push(task);
                } else {
                    tasks['daily-tasks'].push(task);
                }
            }

            history.push({ action: 'statusChange', task: { text: taskText, oldStatus, newStatus }, time: new Date() });
        }
    }

    updateTaskList();
    updateHistoryList();
}

// Function to update the task list
function updateTaskList(filteredTasks) {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '';

    const currentCategory = document.querySelector('.sidebar .active')?.id || 'all-tasks';
    (filteredTasks || tasks[currentCategory]).forEach(task => {
        const listItem = document.createElement('li');
        listItem.classList.add('fade-in');
        listItem.innerHTML = `
            <span>${task.text}</span>
            <select class="status-dropdown">
                <option value="Yet To Start" ${task.status === 'Yet To Start' ? 'selected' : ''}>Yet To Start</option>
                <option value="In Progress" ${task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                <option value="Completed" ${task.status === 'Completed' ? 'selected' : ''}>Completed</option>
            </select>
            <button class="complete-btn">Complete</button>
            <button class="delete-btn">Delete</button>
        `;

        listItem.querySelector('.complete-btn').addEventListener('click', () => completeTask(task.text));
        listItem.querySelector('.delete-btn').addEventListener('click', () => removeTask(task.text));
        listItem.querySelector('.status-dropdown').addEventListener('change', (e) => changeTaskStatus(task.text, e.target.value));

        taskList.appendChild(listItem);
    });
}

// Function to update the history list
function updateHistoryList(filter = 'all') {
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '';

    let filteredHistory = history;

    if (filter !== 'all') {
        const now = new Date();
        let timeFilter;
        switch (filter) {
            case '24-hours': timeFilter = 24 * 60 * 60 * 1000; break;
            case '3-days': timeFilter = 3 * 24 * 60 * 60 * 1000; break;
            case '1-week': timeFilter = 7 * 24 * 60 * 60 * 1000; break;
            case '1-month': timeFilter = 30 * 24 * 60 * 60 * 1000; break;
            case '6-months': timeFilter = 6 * 30 * 24 * 60 * 60 * 1000; break;
            case '1-year': timeFilter = 365 * 24 * 60 * 60 * 1000; break;
            default: timeFilter = now;
        }

        filteredHistory = history.filter(entry => now - entry.time < timeFilter);
    }

    filteredHistory.forEach(entry => {
        const listItem = document.createElement('li');
        listItem.classList.add('fade-in');
        let historyText = `[${formatDate(entry.time)}]`;

        switch (entry.action) {
            case 'add':
                historyText += ` Added task: "${entry.task.text}" to ${entry.task.category}`;
                break;
            case 'remove':
                historyText += ` Removed task: "${entry.task.text}"`;
                break;
            case 'complete':
                historyText += ` Completed task: "${entry.task.text}"`;
                break;
            case 'statusChange':
                historyText += ` Changed status of task: "${entry.task.text}" from ${entry.task.oldStatus} to ${entry.task.newStatus}`;
                break;
        }

        listItem.textContent = historyText;
        historyList.appendChild(listItem);
    });
}

// Event listeners
document.getElementById('add-task-btn').addEventListener('click', () => {
    const taskInput = document.getElementById('new-task');
    const taskCategory = document.getElementById('task-category').value;
    if (taskInput.value.trim()) {
        addTask(taskInput.value.trim(), taskCategory);
        taskInput.value = '';
    }
});

document.getElementById('search-task').addEventListener('input', (e) => {
    const searchText = e.target.value.toLowerCase();
    const currentCategory = document.querySelector('.sidebar .active')?.id || 'all-tasks';
    const filteredTasks = tasks[currentCategory].filter(task => task.text.toLowerCase().includes(searchText));
    updateTaskList(filteredTasks);
});

document.querySelectorAll('.sidebar a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.sidebar a').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        document.getElementById('list-title').innerText = link.textContent;
        updateTaskList();
    });
});

// document.getElementById('search-btn').addEventListener('click', () => {
//     const searchTerm = document.getElementById('search-task').value.toLowerCase();
//     const filteredTasks = tasks['all-tasks'].filter(task => task.text.toLowerCase().includes(searchTerm));
//     updateTaskList(filteredTasks);
// });



// document.getElementById('filter-history-btn').addEventListener('click', () => {
//     const filter = document.getElementById('history-filter').value;
//     updateHistoryList(filter);
// });
document.getElementById('filter-history-btn').addEventListener('click', () => {
    const historyFilterSelect = document.getElementById('history-filter');
    const filter = historyFilterSelect.value;
    updateHistoryList(filter);
    document.getElementById('back-btn').style.display = 'inline-block';
});

document.getElementById('back-btn').addEventListener('click', () => {
    updateHistoryList('all');
    document.getElementById('back-btn').style.display = 'none';
});

document.getElementById('clear-history-btn').addEventListener('click', () => {
    history = [];
    updateHistoryList();
});

document.querySelector('.toggle-sidebar-btn').addEventListener('click', () => {
    document.querySelector('.sidebar').classList.toggle('open');
});

function formatDate(date) {
    return date.toLocaleString();
}

// Initial rendering
updateTaskList();
updateHistoryList();
