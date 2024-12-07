// Firebase configuration (replace with your actual Firebase project values)
const firebaseConfig = {
    apiKey: "AIzaSyDNoPJvYYTEXv3jZxGHQUcbwv82J5C5Tno",
    authDomain: "datacheck-11e08.firebaseapp.com",
    databaseURL: "https://datacheck-11e08-default-rtdb.firebaseio.com",
    projectId: "datacheck-11e08",
    storageBucket: "datacheck-11e08.firebasestorage.app",
    messagingSenderId: "385327087776",
    appId: "1:385327087776:web:2233b4dccf3fa2d77809c5",
    measurementId: "G-KMFZDRCWJK"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

const weeksContainer = document.getElementById("weeks-container");
const checklistSection = document.getElementById("checklist-section");
const checklistTableBody = document.getElementById("checklist-table-body");
const selectedWeekTitle = document.getElementById("selected-week-title");
const backToWeeksButton = document.getElementById("back-to-weeks");
const addItemButton = document.getElementById("add-item");

let currentWeek = "";
let weeklyData = {};

// Generate weeks dynamically
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
function loadOrCreateWeek(week) {
    currentWeek = week;
    selectedWeekTitle.textContent = `${week} Checklist`;

    checklistTableBody.innerHTML = "";
    checklistSection.style.display = "block";
    weeksContainer.parentElement.style.display = "none";

    const ref = database.ref('checklists/' + week);

    ref.once('value')
        .then(snapshot => {
            const weekChecklist = snapshot.val() || [];
            weekChecklist.forEach(item => {
                addRowToTable(item.componentName, item.status, item.notes);
            });
        });
}

// Save current week's checklist to Firebase
function saveCurrentWeek() {
    const ref = database.ref('checklists/' + currentWeek);
    const rows = checklistTableBody.querySelectorAll("tr");
    const data = Array.from(rows).map(row => ({
        componentName: row.cells[0].textContent,
        status: row.cells[1].textContent,
        notes: row.cells[2].textContent,
    }));

    ref.set(data).catch(console.error);
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
    saveCurrentWeek();
}

// Remove a row from the checklist table
function removeRow(button) {
    button.parentElement.parentElement.remove();
    saveCurrentWeek();
}

// Back to weeks menu
backToWeeksButton.addEventListener("click", () => {
    checklistSection.style.display = "none";
    weeksContainer.parentElement.style.display = "block";
});

// Start everything
document.addEventListener("DOMContentLoaded", () => {
    generateWeeks();
});
