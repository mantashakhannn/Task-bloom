
// PETALORA - PERSONAL TASK PLANNER

let tasks = JSON.parse(localStorage.getItem("petaloraTasks")) || [];

let lists = JSON.parse(localStorage.getItem("petaloraLists")) || ["My Tasks"];

let currentFilter = "All";
let selectedDate = "";
let calendarDate = new Date();
let notificationTimers = [];


// GET ELEMENTS

const taskForm = document.getElementById("taskForm");
const taskContainer = document.getElementById("taskContainer");

const taskTitle = document.getElementById("taskTitle");
const taskCategory = document.getElementById("taskCategory");
const taskPriority = document.getElementById("taskPriority");
const taskDate = document.getElementById("taskDate");
const taskTime = document.getElementById("taskTime");
const taskReminder = document.getElementById("taskReminder");
const taskNotes = document.getElementById("taskNotes");
const taskImportant = document.getElementById("taskImportant");

const editId = document.getElementById("editId");
const submitTask = document.getElementById("submitTask");
const cancelEdit = document.getElementById("cancelEdit");


// SAVE DATA

function saveData() {
    localStorage.setItem("petaloraTasks", JSON.stringify(tasks));
    localStorage.setItem("petaloraLists", JSON.stringify(lists));
}


// TOAST MESSAGE

function showToast(message) {
    const toast = document.getElementById("toast");

    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}


// DATE FUNCTIONS

function todayString() {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatDate(date) {
    if (!date) return "No date";

    return new Date(date + "T00:00:00").toLocaleDateString(
        "en-US",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );
}


// HEADER DATE

document.getElementById("todayDate").textContent =
    new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
    });

document.getElementById("headerDate").textContent =
    new Date().toLocaleDateString("en-US", {
        day: "numeric",
        month: "short"
    });


// NAVIGATION

const navButtons = document.querySelectorAll(".nav-btn");

navButtons.forEach(button => {

    button.addEventListener("click", () => {

        navButtons.forEach(btn => btn.classList.remove("active"));

        button.classList.add("active");

        document.querySelectorAll(".page").forEach(page => {
            page.classList.remove("active");
        });

        const page = button.dataset.page;

        document.getElementById(page).classList.add("active");

        const titles = {
            dashboard: "My Dashboard",
            planner: "My Planner",
            settings: "Settings"
        };

        document.getElementById("pageTitle").textContent = titles[page];

        if (page === "planner") {
            renderCalendar();
            renderUpcoming();
        }
    });

});


// CREATE TASK

taskForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const title = taskTitle.value.trim();

    if (!title) {
        showToast("Please enter a task name!");
        return;
    }

    const date = taskDate.value;
    const time = taskTime.value;

    if (date && date < todayString()) {
        showToast("Please choose today or a future date.");
        return;
    }

    if (date === todayString() && time) {
        const due = new Date(date + "T" + time);

        if (due < new Date()) {
            showToast("Please choose a future time.");
            return;
        }
    }

    const taskData = {
        title: title,
        category: taskCategory.value,
        priority: taskPriority.value,
        date: date,
        time: time,
        reminder: Number(taskReminder.value),
        notes: taskNotes.value.trim(),
        important: taskImportant.checked
    };

    if (editId.value) {

        const task = tasks.find(t => t.id === editId.value);

        if (task) {
            Object.assign(task, taskData);
        }

        showToast("Task updated successfully! 🌸");

    } else {

        tasks.push({
            id: Date.now().toString(),
            ...taskData,
            completed: false,
            notified: false,
            list: document.getElementById("listSelect").value
        });

        showToast("New task added! ✨");
    }

    saveData();

    taskForm.reset();

    editId.value = "";

    submitTask.textContent = "+ Add Task";
    cancelEdit.classList.add("hidden");

    renderTasks();
    renderCalendar();
    renderUpcoming();
});


// DISPLAY TASKS

function renderTasks() {

    taskContainer.innerHTML = "";

    const search = document.getElementById("searchTask").value.toLowerCase();

    const category = document.getElementById("filterCategory").value;

    const selectedList = document.getElementById("listSelect").value;

    let filteredTasks = tasks.filter(task => {

        const matchesSearch =
            task.title.toLowerCase().includes(search) ||
            (task.notes || "").toLowerCase().includes(search);

        const matchesCategory =
            category === "All" || task.category === category;

        const matchesList = task.list === selectedList;

        const matchesFilter =
            currentFilter === "All" ||
            (currentFilter === "Pending" && !task.completed) ||
            (currentFilter === "Completed" && task.completed) ||
            (currentFilter === "Important" && task.important);

        const matchesDate =
            !selectedDate || task.date === selectedDate;

        return matchesSearch && matchesCategory &&
            matchesList && matchesFilter && matchesDate;
    });

    if (filteredTasks.length === 0) {

        taskContainer.innerHTML = `
            <div class="empty-state">
                🌸 No tasks here. Add something lovely!
            </div>
        `;

    } else {

        filteredTasks.sort((a, b) => {

            if (a.completed !== b.completed) {
                return Number(a.completed) - Number(b.completed);
            }

            return (a.date || "9999").localeCompare(b.date || "9999");
        });

        filteredTasks.forEach(task => {

            const card = document.createElement("div");

            card.className = "task-card" +
                (task.completed ? " completed" : "");

            const check = document.createElement("input");
            check.type = "checkbox";
            check.className = "task-check";
            check.checked = task.completed;

            check.addEventListener("change", () => {
                task.completed = check.checked;
                saveData();
                renderTasks();
                renderCalendar();
                renderUpcoming();
            });

            const info = document.createElement("div");
            info.className = "task-info";

            const title = document.createElement("h3");
            title.textContent =
                (task.important ? "⭐ " : "") + task.title;

            const notes = document.createElement("p");
            notes.textContent = task.notes || "No additional notes";

            const meta = document.createElement("div");
            meta.className = "task-meta";

            const tags = [
                task.category,
                task.priority,
                task.date ? formatDate(task.date) : "No date",
                task.time || ""
            ].filter(Boolean);

            tags.forEach((value, index) => {

                const tag = document.createElement("span");
                tag.className = "tag";

                if (index === 1 && value === "High") {
                    tag.classList.add("high");
                }

                if (index === 1 && value === "Urgent") {
                    tag.classList.add("urgent");
                }

                tag.textContent = value;
                meta.appendChild(tag);
            });

            if (task.completed) {
                const done = document.createElement("span");
                done.className = "tag";
                done.textContent = "Completed";
                meta.appendChild(done);
            }

            info.appendChild(title);
            info.appendChild(notes);
            info.appendChild(meta);

            const actions = document.createElement("div");
            actions.className = "task-actions";

            const editButton = document.createElement("button");
            editButton.textContent = "✏️";
            editButton.title = "Edit task";

            editButton.addEventListener("click", () => editTask(task.id));

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "🗑️";
            deleteButton.title = "Delete task";

            deleteButton.addEventListener("click", () => deleteTask(task.id));

            actions.appendChild(editButton);
            actions.appendChild(deleteButton);

            card.appendChild(check);
            card.appendChild(info);
            card.appendChild(actions);

            taskContainer.appendChild(card);
        });
    }

    updateStats();
}


// EDIT TASK

function editTask(id) {

    const task = tasks.find(t => t.id === id);

    if (!task) return;

    taskTitle.value = task.title;
    taskCategory.value = task.category;
    taskPriority.value = task.priority;
    taskDate.value = task.date || "";
    taskTime.value = task.time || "";
    taskReminder.value = String(task.reminder);
    taskNotes.value = task.notes || "";
    taskImportant.checked = task.important;

    editId.value = task.id;

    submitTask.textContent = "Save Changes";
    cancelEdit.classList.remove("hidden");

    document.getElementById("dashboard").scrollIntoView({
        behavior: "smooth"
    });

    taskTitle.focus();
}


// CANCEL EDIT

cancelEdit.addEventListener("click", () => {

    taskForm.reset();
    editId.value = "";

    submitTask.textContent = "+ Add Task";
    cancelEdit.classList.add("hidden");

});


// DELETE TASK

function deleteTask(id) {

    if (!confirm("Are you sure you want to delete this task?")) {
        return;
    }

    tasks = tasks.filter(task => task.id !== id);

    saveData();
    renderTasks();
    renderCalendar();
    renderUpcoming();

    showToast("Task deleted successfully.");
}


// FILTER BUTTONS

document.querySelectorAll(".filter-btn").forEach(button => {

    button.addEventListener("click", () => {

        document.querySelectorAll(".filter-btn").forEach(btn => {
            btn.classList.remove("active");
        });

        button.classList.add("active");

        currentFilter = button.dataset.filter;

        renderTasks();
    });

});


// SEARCH AND CATEGORY FILTER

document.getElementById("searchTask").addEventListener("input", renderTasks);

document.getElementById("filterCategory").addEventListener("change", renderTasks);


// UPDATE STATISTICS

function updateStats() {

    const list = document.getElementById("listSelect").value;

    const currentTasks = tasks.filter(task => task.list === list);

    const total = currentTasks.length;

    const completed = currentTasks.filter(t => t.completed).length;

    const pending = total - completed;

    const important = currentTasks.filter(t => t.important).length;

    const progress = total === 0 ? 0 :
        Math.round((completed / total) * 100);

    document.getElementById("totalCount").textContent = total;

    document.getElementById("completedCount").textContent = completed;

    document.getElementById("pendingCount").textContent = pending;

    document.getElementById("importantCount").textContent = important;

    document.getElementById("progressPercent").textContent =
        progress + "%";

    document.getElementById("progressBar").style.width =
        progress + "%";
}


// RESET CURRENT LIST

document.getElementById("resetListBtn").addEventListener("click", () => {

    const list = document.getElementById("listSelect").value;

    if (!confirm("Delete all tasks from this list?")) return;

    tasks = tasks.filter(task => task.list !== list);

    saveData();
    renderTasks();
    renderCalendar();
    renderUpcoming();

    showToast("Current list has been reset.");
});


// CREATE MULTIPLE LISTS

document.getElementById("createListBtn").addEventListener("click", () => {

    const input = document.getElementById("listName");

    const name = input.value.trim();

    if (!name) {
        showToast("Please enter a list name.");
        return;
    }

    if (lists.some(list => list.toLowerCase() === name.toLowerCase())) {
        showToast("This list already exists.");
        return;
    }

    lists.push(name);

    saveData();
    renderLists();

    document.getElementById("listSelect").value = name;

    input.value = "";

    renderTasks();

    showToast("New list created! 🌷");
});


function renderLists() {

    const select = document.getElementById("listSelect");

    select.innerHTML = "";

    lists.forEach(list => {

        const option = document.createElement("option");

        option.value = list;
        option.textContent = list;

        select.appendChild(option);
    });
}


document.getElementById("listSelect").addEventListener("change", () => {

    selectedDate = "";
    renderTasks();
});


// CALENDAR

function renderCalendar() {

    const grid = document.getElementById("calendarGrid");

    grid.innerHTML = "";

    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    document.getElementById("monthTitle").textContent =
        calendarDate.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric"
        });

    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    weekdays.forEach(day => {

        const cell = document.createElement("div");

        cell.className = "calendar-day weekday";
        cell.textContent = day;

        grid.appendChild(cell);
    });


    for (let i = 0; i < firstDay; i++) {

        const blank = document.createElement("div");

        grid.appendChild(blank);
    }


    for (let day = 1; day <= daysInMonth; day++) {

        const dateString =
            `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        const cell = document.createElement("button");

        cell.className = "calendar-day";
        cell.textContent = day;

        const dayTasks = tasks.filter(task => task.date === dateString);

        if (dateString === todayString()) {
            cell.classList.add("today");
        }

        if (dayTasks.some(task => task.important)) {
            cell.classList.add("important-date");
        }

        if (selectedDate === dateString) {
            cell.classList.add("selected");
        }

        cell.title = dayTasks.length + " task(s)";

        cell.addEventListener("click", () => {

            selectedDate = selectedDate === dateString ? "" : dateString;

            renderCalendar();
            renderTasks();

            document.getElementById("pageTitle").textContent =
                selectedDate ? "Tasks for " + formatDate(selectedDate) : "My Planner";

        });

        grid.appendChild(cell);
    }
}


document.getElementById("prevMonth").addEventListener("click", () => {

    calendarDate.setMonth(calendarDate.getMonth() - 1);

    renderCalendar();
});


document.getElementById("nextMonth").addEventListener("click", () => {

    calendarDate.setMonth(calendarDate.getMonth() + 1);

    renderCalendar();
});


document.getElementById("clearDateFilter").addEventListener("click", () => {

    selectedDate = "";

    renderCalendar();
    renderTasks();

    showToast("Showing all tasks.");
});


// UPCOMING TASKS

function renderUpcoming() {

    const container = document.getElementById("upcomingTasks");

    container.innerHTML = "";

    const upcoming = tasks
        .filter(task => !task.completed && task.date >= todayString())
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 8);

    if (upcoming.length === 0) {

        container.innerHTML =
            `<div class="empty-state">🌷 No upcoming tasks yet.</div>`;

        return;
    }

    upcoming.forEach(task => {

        const item = document.createElement("div");

        item.className = "upcoming-item";

        item.textContent =
            (task.important ? "⭐ " : "🌸 ") +
            task.title + " — " + formatDate(task.date) +
            (task.time ? " at " + task.time : "");

        container.appendChild(item);
    });
}


// THEME SYSTEM

function setTheme(theme) {

    document.body.classList.toggle("dark", theme === "dark");

    localStorage.setItem("petaloraTheme", theme);

    document.getElementById("themeBtn").textContent =
        theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode";
}


const savedTheme = localStorage.getItem("petaloraTheme") || "light";

setTheme(savedTheme);


document.getElementById("themeBtn").addEventListener("click", () => {

    const dark = document.body.classList.contains("dark");

    setTheme(dark ? "light" : "dark");
});


document.getElementById("lightModeBtn").addEventListener("click", () => {
    setTheme("light");
    showToast("Light mode activated! ☀️");
});


document.getElementById("darkModeBtn").addEventListener("click", () => {
    setTheme("dark");
    showToast("Dark mode activated! 🌙");
});


// NOTIFICATION PERMISSION

async function enableNotifications() {

    if (!("Notification" in window)) {
        showToast("Notifications are not supported by this browser.");
        return;
    }

    if (Notification.permission === "granted") {
        showToast("Notifications are already enabled!");
        return;
    }

    const permission = await Notification.requestPermission();

    updateNotificationStatus();

    if (permission === "granted") {
        showToast("Notifications enabled! 🔔");
        scheduleReminders();
    } else {
        showToast("Notification permission was not granted.");
    }
}


function updateNotificationStatus() {

    const status = document.getElementById("notificationStatus");

    if (!("Notification" in window)) {
        status.textContent = "Not supported by this browser.";
        return;
    }

    status.textContent =
        Notification.permission === "granted" ? "Notifications enabled ✓" :
        Notification.permission === "denied" ? "Notifications blocked in browser." :
        "Permission not requested.";
}


document.getElementById("notificationBtn").addEventListener("click", enableNotifications);

document.getElementById("enableNotifications").addEventListener("click", enableNotifications);


// REMINDER SOUND

let audioContext;

function playSound() {

    const sound = document.getElementById("soundSelect").value;

    if (sound === "none") return;

    const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return;

    audioContext = audioContext || new AudioContextClass();

    if (audioContext.state === "suspended") {
        audioContext.resume();
    }

    const sounds = {
        bell: [880, 1175],
        chime: [659, 880, 1047],
        gentle: [523, 659]
    };

    const notes = sounds[sound] || sounds.bell;

    notes.forEach((frequency, index) => {

        const oscillator = audioContext.createOscillator();

        const gain = audioContext.createGain();

        oscillator.frequency.value = frequency;
        oscillator.type = "sine";

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        const start = audioContext.currentTime + index * 0.25;

        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.15, start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);

        oscillator.start(start);
        oscillator.stop(start + 0.4);
    });
}


document.getElementById("testSound").addEventListener("click", () => {

    playSound();

    showToast("Testing your reminder sound! 🎵");
});


// REMINDER SCHEDULER

function scheduleReminders() {

    notificationTimers.forEach(timer => clearTimeout(timer));

    notificationTimers = [];

    if (!("Notification" in window) ||
        Notification.permission !== "granted") return;

    const now = Date.now();

    tasks.forEach(task => {

        if (!task.date || !task.time || task.completed) return;

        if (task.reminder === -1 || task.notified) return;

        const dueTime = new Date(
            task.date + "T" + task.time
        ).getTime();

        const reminderTime = dueTime - task.reminder * 60000;

        const delay = reminderTime - now;

        if (delay <= 0 || delay > 2147480000) return;

        const timer = setTimeout(() => {

            const stillExists = tasks.find(t => t.id === task.id);

            if (!stillExists || stillExists.completed) return;

            new Notification("Petalora Reminder 🌸", {
                body: "It's time for: " + task.title
            });

            playSound();

            stillExists.notified = true;

            saveData();

        }, delay);

        notificationTimers.push(timer);
    });
}


// SETTINGS: SAVE SOUND

const soundSelect = document.getElementById("soundSelect");

soundSelect.value =
    localStorage.getItem("petaloraSound") || "bell";

soundSelect.addEventListener("change", () => {

    localStorage.setItem("petaloraSound", soundSelect.value);

    showToast("Reminder sound saved! 🎵");
});


// EXPORT BACKUP

document.getElementById("exportBtn").addEventListener("click", () => {

    const backup = {
        tasks: tasks,
        lists: lists
    };

    const file = new Blob(
        [JSON.stringify(backup, null, 2)],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(file);

    const link = document.createElement("a");

    link.href = url;
    link.download = "Petalora-Backup.json";

    link.click();

    URL.revokeObjectURL(url);

    showToast("Backup downloaded! 💾");
});


// IMPORT BACKUP

document.getElementById("importFile").addEventListener("change", event => {

    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function() {

        try {

            const backup = JSON.parse(reader.result);

            if (!backup || !Array.isArray(backup.tasks) ||
                !Array.isArray(backup.lists) ||
                !backup.lists.every(item => typeof item === "string") ||
                !backup.tasks.every(task =>
                    task && typeof task.id === "string" &&
                    typeof task.title === "string" &&
                    typeof task.list === "string"
                )) {
                throw new Error("Invalid backup");
            }

            if (!confirm("Replace your current data with this backup?")) {
                return;
            }

            tasks = backup.tasks;
            lists = backup.lists;

            saveData();
            renderLists();
            renderTasks();
            renderCalendar();
            renderUpcoming();

            scheduleReminders();

            showToast("Backup restored successfully! 🌷");

        } catch (error) {

            showToast("Invalid backup file.");

        }
    };

    reader.readAsText(file);

    event.target.value = "";
});


// DELETE ALL DATA

document.getElementById("deleteAllBtn").addEventListener("click", () => {

    if (!confirm("This will delete ALL tasks and lists. Continue?")) {
        return;
    }

    tasks = [];
    lists = ["My Tasks"];

    saveData();

    renderLists();
    renderTasks();
    renderCalendar();
    renderUpcoming();

    scheduleReminders();

    showToast("All data has been deleted.");
});


// REFRESH REMINDERS WHEN TASKS CHANGE

const originalSaveData = saveData;

saveData = function() {
    originalSaveData();
    scheduleReminders();
};


// INITIALIZE WEBSITE

renderLists();
renderTasks();
renderCalendar();
renderUpcoming();
updateNotificationStatus();
scheduleReminders();

