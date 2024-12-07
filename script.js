// Firebase configuration (replace with your actual configuration)
const firebaseConfig = {
    apiKey: "AIzaSyDNoPJvYYTEXv3jZxGHQUcbwv82J5C5Tno",
    authDomain: "datacheck-11e08.firebaseapp.com",
    databaseURL: "https://datacheck-11e08-default-rtdb.firebaseio.com",
    projectId: "datacheck-11e08",
    storageBucket: "datacheck-11e08.firebasestorage.app",
    messagingSenderId: "385327087776",
    appId: "1:385327087776:web:291a453c0157205d7809c5",
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const database = firebase.getDatabase(app);

// DOM Elements
const weeksContainer = document.getElementById("weeks-container");
const checklistSection = document.getElementById("checklist-section");
const checklistTableBody = document.getElementById("checklist-table-body");
const selectedWeekTitle = document.getElementById("selected-week-title");
const backToWeeksButton = document.getElementById("back-to-weeks");
const addItemButton = document.getElementById("add-item");

// Global Variables
let currentWeek = "";

// Generate week tiles
function generateWeeks(numWeeks = 52) {
    for (let i = 1; i <= numWeeks; i++) {
        const weekTile = document.createElement("div");
        weekTile.className = "week-tile";
        weekTile.textContent = `Week ${i}`;
        weekTile.dataset.week = `Week ${i}`;
        weekTile.addEventListener("click", () => loadOrCreateWeek(`Week ${i}`));
        weeksContainer.appendChild(weekTile);
    }
}

// Load or create a week's checklist
async function loadOrCreateWeek(week) {
    currentWeek = week;
    selectedWeekTitle.textContent = `${week} Checklist`;
    checklistTableBody.innerHTML = ""; // Clear existing rows
    checklistSection.style.display = "block";
    weeksContainer.parentElement.style.display = "none";

    const weekChecklist = await loadChecklistFromFirebase(week);
    weekChecklist.forEach(item => addRowToTable(item.componentName, item.status, item.notes));
}

// Add a row to the checklist table
function addRowToTable(componentName, status, notes) {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${componentName}</td>
        <td>${status}</td>
        <td>${notes}</td>
        <td><button onclick="removeRow(this)">Remove</button></td>
    `;
    checklistTableBody.appendChild(row);
    saveCurrentWeek(); // Automatically save after adding a row
}

// Remove a row from the checklist table
function removeRow(button) {
    const row = button.parentElement.parentElement;
    row.remove();
    saveCurrentWeek(); // Automatically save after removing a row
}

// Add a new item to the checklist
addItemButton.addEventListener("click", () => {
    const componentName = document.getElementById("component-name").value.trim();
    const status = document.getElementById("component-status").value;
    const notes = document.getElementById("notes").value.trim();

    if (!componentName) {
        alert("Please provide a component name.");
        return;
    }

    addRowToTable(componentName, status, notes);

    // Clear form inputs
    document.getElementById("component-name").value = "";
    document.getElementById("notes").value = "";
});

// Save the current week's checklist to Firebase
async function saveCurrentWeek() {
    const rows = checklistTableBody.querySelectorAll("tr");
    const data = Array.from(rows).map(row => {
        const cells = row.querySelectorAll("td");
        return {
            componentName: cells[0].textContent,
            status: cells[1].textContent,
            notes: cells[2].textContent,
        };
    });

    try {
        await firebase.set(firebase.ref(database, `checklists/${currentWeek}`), data);
        console.log(`Week ${currentWeek} data saved successfully.`);
    } catch (error) {
        console.error("Error saving checklist data:", error);
    }
}

// Load checklist data from Firebase
async function loadChecklistFromFirebase(week) {
    try {
        const snapshot = await firebase.get(firebase.ref(database, `checklists/${week}`));
        if (snapshot.exists()) {
            return snapshot.val();
        } else {
            return [];
        }
    } catch (error) {
        console.error("Error loading checklist data:", error);
        return [];
    }
}

// Back to weeks menu
backToWeeksButton.addEventListener("click", () => {
    checklistSection.style.display = "none";
    weeksContainer.parentElement.style.display = "block";
});

// Initialize weeks grid
generateWeeks();
