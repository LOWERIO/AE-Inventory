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

// Prefix hierarchy for sorting
const prefixHierarchy = ["AD", "CC", "CC PT" ,"WR"];


const filterStatus = document.getElementById("filter-status");
const filterPrefix = document.getElementById("filter-prefix");

// Apply filters when dropdowns change
filterStatus.addEventListener("change", applyFilters);
filterPrefix.addEventListener("change", applyFilters);

function applyFilters() {
    const selectedStatus = filterStatus.value;
    const selectedPrefix = filterPrefix.value;

    const rows = checklistTableBody.querySelectorAll("tr");

    rows.forEach(row => {
        const componentName = row.cells[0].textContent.trim();
        const status = row.cells[1].textContent.trim();

        // Extract prefix from component name
        const [prefix] = parseStation(componentName);

        // Check if the row matches the filters
        const matchesStatus = selectedStatus === "all" || status === selectedStatus;
        const matchesPrefix = selectedPrefix === "all" || prefix === selectedPrefix;

        // Show or hide the row based on filters
        row.style.display = matchesStatus && matchesPrefix ? "" : "none";
    });
}


// Generate week tiles
function generateWeeks(numWeeks = 4) {
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

    checklistTableBody.innerHTML = ""; // Clear existing rows
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

// Add a row to the checklist table
function addRowToTable(componentName, status, notes) {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${componentName}</td>
        <td class="${status}"><div class="${status}"></div>${status}</td>
        <td>${notes}</td>
        <td>
            <button class="edit_item" onclick="editRow(this)">Edit</button>
            <button class="remove_item" onclick="removeRow(this)">Remove</button>
        </td>
    `;
    checklistTableBody.appendChild(row);

    sortTable(); // Sort rows after adding
    saveCurrentWeek(); // Automatically save after adding a row
}

// Edit a row in the checklist table
function editRow(button) {
    const row = button.parentElement.parentElement;
    const componentNameCell = row.children[0];
    const statusCell = row.children[1];
    const notesCell = row.children[2];

    // Populate modal fields with current row data
    document.getElementById("edit-component-name").value = componentNameCell.textContent;
    document.getElementById("edit-component-status").value = statusCell.textContent;
    document.getElementById("edit-notes").value = notesCell.textContent;

    // Show the modal
    const modal = document.getElementById("edit-modal");
    modal.style.scale = 1;

    // Add save changes functionality
    document.getElementById("save-changes").onclick = () => {
        const newComponentName = document.getElementById("edit-component-name").value.trim();
        const newStatus = document.getElementById("edit-component-status").value.trim();
        const newNotes = document.getElementById("edit-notes").value.trim();

        if (newComponentName) componentNameCell.textContent = newComponentName;
        if (newStatus) {
            statusCell.textContent = newStatus;
            statusCell.className = newStatus;
        }
        if (newNotes) notesCell.textContent = newNotes;

        sortTable(); // Re-sort after editing
        saveCurrentWeek(); // Save changes
        modal.style.scale = 0; // Close modal
    };

    // Close modal on cancel
    document.getElementById("cancel-edit").onclick = () => {
        modal.style.scale = 0;
    };
    document.getElementById("close-modal").onclick = () => {
        modal.style.scale = 0;
    };
}

function create_item() {
    const input = document.getElementById("component-name");
    const modal = document.getElementById("add-modal");
    modal.style.scale = 1;
    input.focus();
    document.getElementById("add-item").onclick = () => {
        modal.style.scale = 0; // Close modal
    };

    document.getElementById("cancel-add").onclick = () => {
        modal.style.scale = 0;
    };
    document.getElementById("close-add").onclick = () => {
        modal.style.scale = 0;
    };
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

    // Clear input fields
    document.getElementById("component-name").value = "";
    document.getElementById("notes").value = "";
});

// Save the current week's checklist to Firebase
function saveCurrentWeek() {
    const rows = checklistTableBody.querySelectorAll("tr");
    const data = Array.from(rows).map(row => {
        const cells = row.querySelectorAll("td");
        return {
            componentName: cells[0].textContent,
            status: cells[1].textContent,
            notes: cells[2].textContent,
        };
    });

    const ref = database.ref('checklists/' + currentWeek);
    ref.set(data).catch(console.error);
}
function sortTable() {
    const rows = Array.from(checklistTableBody.querySelectorAll("tr"));

    rows.sort((a, b) => {
        const nameA = a.cells[0].textContent.trim();
        const nameB = b.cells[0].textContent.trim();

        // Extract prefix and station number
        const [prefixA, numberA] = parseStation(nameA);
        const [prefixB, numberB] = parseStation(nameB);

        // Compare by prefix hierarchy
        const prefixOrderA = getCustomPrefixOrder(prefixA);
        const prefixOrderB = getCustomPrefixOrder(prefixB);

        if (prefixOrderA !== prefixOrderB) {
            return prefixOrderA - prefixOrderB; // Sort by prefix
        }

        // If prefixes are the same, sort numerically by station number
        return numberA - numberB;
    });

    // Re-add sorted rows to the table
    rows.forEach(row => checklistTableBody.appendChild(row));
}

// Custom prefix order logic
function getCustomPrefixOrder(prefix) {
    // Handle specific cases for sub-prefixes
    if (prefix === "CC PT") return prefixHierarchy.indexOf("CC") + 0.5; // Place "CC PT" after "CC"
    return prefixHierarchy.indexOf(prefix);
}

// Parse station name into prefix and number
function parseStation(name) {
    const match = name.match(/^([A-Z]+(?:\sPT)?)\s+station\s+(\d+)$/i);
    if (match) {
        return [match[1].toUpperCase(), parseInt(match[2], 10)];
    }
    return ["", 0]; // Default values for unrecognized format
}

// Back to weeks menu
backToWeeksButton.addEventListener("click", () => {
    checklistSection.style.display = "none";
    weeksContainer.parentElement.style.display = "block";
});

// Initialize weeks grid
document.addEventListener("DOMContentLoaded", () => {
    generateWeeks();
});
