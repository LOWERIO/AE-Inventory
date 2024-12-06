const repo = "lowerio/DOC"; // Replace with your GitHub repository
const branch = "main"; // Replace with your branch name
const filePath = "data.json"; // Path to your JSON file in the repo
const token = "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"; // Replace with your GitHub token

const weeksContainer = document.getElementById("weeks-container");
const checklistSection = document.getElementById("checklist-section");
const checklistTableBody = document.getElementById("checklist-table-body");
const selectedWeekTitle = document.getElementById("selected-week-title");
const backToWeeksButton = document.getElementById("back-to-weeks");
const addItemButton = document.getElementById("add-item");

let currentWeek = "";
let weeklyData = {};

// GitHub API Helpers
async function fetchGitHubFile() {
    try {
        const response = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}?ref=${branch}`, {
            headers: {
                Authorization: `token ${token}`,
                Accept: "application/vnd.github.v3+json",
            },
        });

        if (response.ok) {
            const fileData = await response.json();
            return JSON.parse(atob(fileData.content)); // Decode base64 content
        } else if (response.status === 404) {
            console.log("File not found. Initializing empty data.");
            return {};
        } else {
            console.error("Error fetching file:", await response.json());
        }
    } catch (error) {
        console.error("Error connecting to GitHub:", error);
    }
}

async function saveGitHubFile(data) {
    try {
        // Fetch file metadata for updates
        const fetchResponse = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}?ref=${branch}`, {
            headers: {
                Authorization: `token ${token}`,
                Accept: "application/vnd.github.v3+json",
            },
        });

        let sha = null;
        if (fetchResponse.ok) {
            const fileData = await fetchResponse.json();
            sha = fileData.sha;
        }

        // Save (or create) the file
        const response = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
            method: "PUT",
            headers: {
                Authorization: `token ${token}`,
                Accept: "application/vnd.github.v3+json",
            },
            body: JSON.stringify({
                message: "Update checklist data",
                content: btoa(JSON.stringify(data, null, 2)), // Convert JSON to base64
                branch: branch,
                sha: sha, // Include SHA if updating
            }),
        });

        if (response.ok) {
            console.log("Data saved successfully!");
        } else {
            console.error("Error saving file:", await response.json());
        }
    } catch (error) {
        console.error("Error saving data to GitHub:", error);
    }
}

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
function loadOrCreateWeek(week) {
    currentWeek = week;
    selectedWeekTitle.textContent = `${week} Checklist`;
    checklistTableBody.innerHTML = ""; // Clear existing rows
    checklistSection.style.display = "block";
    weeksContainer.parentElement.style.display = "none";

    const weekChecklist = weeklyData[week] || [];
    weekChecklist.forEach(item => {
        addRowToTable(item.componentName, item.status, item.notes);
    });
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

// Save the current week's checklist to GitHub
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

    weeklyData[currentWeek] = data;
    saveGitHubFile(weeklyData);
}

// Back to weeks menu
backToWeeksButton.addEventListener("click", () => {
    checklistSection.style.display = "none";
    weeksContainer.parentElement.style.display = "block";
});

// Initialize weeks grid and fetch data
(async function initialize() {
    weeklyData = await fetchGitHubFile();
    generateWeeks();
})();
