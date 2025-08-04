import { db, auth } from "./firebase.js";
import {
  ref,
  get,
  set
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import {
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const loginForm = document.getElementById("login-form");
const adminUI = document.getElementById("admin-ui");
const stationSelect = document.getElementById("station-select");
const itemList = document.getElementById("item-list");
const addItemBtn = document.getElementById("add-item");
const saveBtn = document.getElementById("save-btn");
const addStationBtn = document.getElementById("add-station-btn");
const newStationInput = document.getElementById("new-station-name");
const notificationContainer = document.getElementById("notification-container");

let hasUnsavedChanges = false;
let saveTimeout = null;
const SAVE_DEBOUNCE_MS = 1000; 


document.getElementById("verificar_st").addEventListener("click", () => {
  open_check();
});

function open_check(){
  window.open(`./check.html?id=${stationSelect.value}`)
}


// Show notification message on screen
function showNotification(message, type = "success") {
  const notif = document.createElement("div");
  notif.className = `notification ${type}`;
  notif.textContent = message;

  notificationContainer.appendChild(notif);

  // Remove notification after 5 seconds
  setTimeout(() => {
    notif.remove();
  }, 5000);
}

// Load all stations from Firebase and populate dropdown
async function loadStations() {
  const stationsRef = ref(db, 'stations');
  const snapshot = await get(stationsRef);
  stationSelect.innerHTML = ''; // clear existing options

  if (!snapshot.exists()) {
    const opt = document.createElement("option");
    opt.value = '';
    opt.textContent = 'Nenhuma estação disponível';
    stationSelect.appendChild(opt);
    return;
  }

  const stationsData = snapshot.val();
  Object.keys(stationsData).forEach(stationId => {
    const opt = document.createElement("option");
    opt.value = stationId;
    opt.textContent = stationId;
    stationSelect.appendChild(opt);
  });
}

// Load items for selected station and render
async function loadStationItems(stationId) {
  if (!stationId) return;

  const stationRef = ref(db, `stations/${stationId}`);
  const snap = await get(stationRef);
  const data = snap.exists() ? snap.val().items || [] : [];

  itemList.innerHTML = "";
  data.forEach((item, i) => renderItem(item, i));
  reindexItems(); // ensure IDs and listeners
  hasUnsavedChanges = false; // just loaded fresh data, no changes yet
}

// Add or remove operations set this and schedule save
function scheduleAutoSave() {
  hasUnsavedChanges = true;
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveChanges();
  }, SAVE_DEBOUNCE_MS);
}

// Save current item list to Firebase for selected station
async function saveChanges() {
  if (!hasUnsavedChanges) return;

  const stationId = stationSelect.value;
  if (!stationId) {
    showNotification("Seleciona uma estação primeiro.", "error");
    return;
  }

  const items = [...itemList.children].map((li, i) => ({
    name: li.querySelector(`#name-${i}`).value.trim(),
    quantity: parseInt(li.querySelector(`#qty-${i}`).value) || 1,
    brand: li.querySelector(`#brand-${i}`).value.trim(),
    color: li.querySelector(`#color-${i}`).value.trim(),
  }));

  try {
    const dataToSave = {};

    if (items.length === 0) {
      
      dataToSave.createdAt = Date.now();
      dataToSave.items = [];
    } else {
     
      dataToSave.items = items;
    }

    await set(ref(db, `stations/${stationId}`), dataToSave);
  } catch (err) {
    showNotification("Falha ao guardar : " + err.message, "error");
    console.error(err);
  }
}

// Attach input listeners for auto-save on all inputs in the item list
function attachInputListeners() {
  [...itemList.children].forEach((li, i) => {
    ["name", "qty", "brand", "color"].forEach(field => {
      const input = li.querySelector(`#${field}-${i}`);
      if (input) {
        input.addEventListener("input", scheduleAutoSave);
      }
    });
  });
}

// Render a single item with Portuguese labels and remove button
function renderItem(item, index) {
  const li = document.createElement("li");
  li.innerHTML = `
    <h4>ITEM ${index + 1}</h4>

    <label for="name-${index}">Nome</label>
    <input id="name-${index}" value="${item.name}" placeholder="Nome" />

    <label for="qty-${index}">Quantidade</label>
    <input id="qty-${index}" type="number" value="${item.quantity}" placeholder="Quantidade" min="1" />

    <label for="brand-${index}">Marca</label>
    <input id="brand-${index}" value="${item.brand}" placeholder="Marca" />

    <label for="color-${index}">Cor</label>
    <input id="color-${index}" value="${item.color}" placeholder="Cor" />

    <button class="remove-item-btn">Remover</button>
  `;

  li.querySelector(".remove-item-btn").addEventListener("click", async () => {
    // Get the current name from the input (in case it was edited)
    const stationID = stationSelect.value;
    const itemName = li.querySelector(`#name-${index}`).value.trim();

    // Remove from Firebase UI
    li.remove();
    reindexItems();
    scheduleAutoSave(); // autosave on remove

    // Remove from Google Sheets
    if (stationID && itemName) {
      await removeItemFromSheets(stationID, itemName);
    }
  });

  itemList.appendChild(li);

  attachInputListeners();
}

// After removing or adding items, re-index inputs & labels and re-attach listeners
function reindexItems() {
  [...itemList.children].forEach((li, i) => {
    li.querySelector("h4").textContent = `ITEM ${i + 1}`;

    li.querySelector("label[for^='name-']").setAttribute("for", `name-${i}`);
    li.querySelector("input[id^='name-']").id = `name-${i}`;

    li.querySelector("label[for^='qty-']").setAttribute("for", `qty-${i}`);
    li.querySelector("input[id^='qty-']").id = `qty-${i}`;

    li.querySelector("label[for^='brand-']").setAttribute("for", `brand-${i}`);
    li.querySelector("input[id^='brand-']").id = `brand-${i}`;

    li.querySelector("label[for^='color-']").setAttribute("for", `color-${i}`);
    li.querySelector("input[id^='color-']").id = `color-${i}`;

    
  });

  attachInputListeners();
}

const tt = document.getElementById("tittle-all");

// Login form submit handler
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    loginForm.style.display = "none";
    adminUI.style.display = "block";
    tt.style.display = "none";

    await loadStations();

    if (stationSelect.options.length > 0) {
      stationSelect.value = stationSelect.options[0].value;
      await loadStationItems(stationSelect.value);
    }
  } catch (err) {
    showNotification("Falha ao iniciar sessão: " + err.message, "error");
  }
});

// Station select change handler
stationSelect.addEventListener("change", async () => {
  await loadStationItems(stationSelect.value);
});

// Add new item button handler
addItemBtn.addEventListener("click", () => {
  const index = itemList.children.length;
  renderItem({ name: "",quantity: 1, brand: "", color: ""  }, index);
  reindexItems();
  scheduleAutoSave();
  updateButtonsState();
});


const removeStationBtn = document.getElementById("remove-station-btn");

const confirmModal = document.getElementById("confirm-modal");
const confirmYesBtn = document.getElementById("confirm-yes");
const confirmNoBtn = document.getElementById("confirm-no");

let stationToDelete = null;  // Guarda o id da estação a remover

removeStationBtn.addEventListener("click", () => {
  const stationId = stationSelect.value;
  if (!stationId) {
    showNotification("Selecione uma estação para remover.", "error");
    return;
  }

  stationToDelete = stationId;
  confirmModal.style.display = "flex";  // Mostrar modal
});

// Se o utilizador clicar em "Sim"
confirmYesBtn.addEventListener("click", async () => {
  if (!stationToDelete) return;

  confirmModal.style.display = "none";

  try {
    await set(ref(db, `stations/${stationToDelete}`), null);

    // Remove from Google Sheets as well
    await removeStationFromSheets(stationToDelete);

    showNotification(`Estação "${stationToDelete}" removida com sucesso!`, "success");

    await loadStations();

    if (stationSelect.options.length > 0) {
      stationSelect.value = stationSelect.options[0].value;
      await loadStationItems(stationSelect.value);
    } else {
      itemList.innerHTML = "";
    }

    updateButtonsState();

  } catch (err) {
    showNotification("Falha ao remover estação: " + err.message, "error");
    console.error(err);
  } finally {
    stationToDelete = null;
  }
});

// Se o utilizador clicar em "Cancelar"
confirmNoBtn.addEventListener("click", () => {
  stationToDelete = null;
  confirmModal.style.display = "none";
});



// Add new station button handler
addStationBtn.addEventListener("click", async () => {
  const newStationName = newStationInput.value.trim();
  if (!newStationName) {
    showNotification("Por favor, insira o nome da estação.", "error");
    return;
  }

  try {
    const stationRef = ref(db, `stations/${newStationName}`);
    const snap = await get(stationRef);

    if (snap.exists()) {
      showNotification("A estação já existe.", "error");
      return;
    }

    await set(stationRef, { iSelecionas: [], createdAt: Date.now() });
    showNotification(`Estação "${newStationName}" adicionada!`, "success");

    await loadStations();
    
    // // Add new station to dropdown and select it
    // const opt = document.createElement("option");
    // opt.value = newStationName;
    // opt.textContent = newStationName;
    

    stationSelect.value = newStationName;
    await loadStationItems(newStationName);

    newStationInput.value = "";
    updateButtonsState();

  } catch (err) {
    showNotification("Falha ao adicionar estação: " + err.message, "error");
    console.error(err);
  }
});

window.addEventListener("beforeunload", (e) => {
  if (hasUnsavedChanges) {
    e.preventDefault();
    e.returnValue = "Tens a certeza que queres sair sem guardar as alterações?";
    return e.returnValue;
  }
});

function updateButtonsState() {
  const stationSelected = stationSelect.value && stationSelect.value.trim() !== "";

  addItemBtn.style.display = stationSelected ? "block" : "none";
  removeStationBtn.style.display = stationSelected ? "block" : "none";
}

stationSelect.addEventListener("change", () => {
  updateButtonsState();
  loadStationItems(stationSelect.value);
});


loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    loginForm.style.display = "none";
    adminUI.style.display = "block";

    await loadStations();

    if (stationSelect.options.length > 0) {
      stationSelect.value = stationSelect.options[0].value;
      await loadStationItems(stationSelect.value);
    }
    updateButtonsState();
  } catch (err) {
    showNotification("Falha ao iniciar sessão: " + err.message, "error");
  }
});





updateButtonsState();
async function removeStationFromSheets(stationID) {
  const formData = new FormData();
  formData.append('action', 'deleteStation');
  formData.append('stationID', stationID);

  // Replace with your actual Apps Script Web App URL:
  await fetch('https://script.google.com/macros/s/AKfycbwjZ0On3VVZSUetSOUdCW86qi2wDMgVvxanp737jveV_ynkHoGjaI6EyA96cNM-DCNUSA/exec', {
    method: 'POST',
    mode: 'no-cors',
    body: formData
  });
}

async function removeItemFromSheets(stationID, itemName) {
  const formData = new FormData();
  formData.append('action', 'deleteItem');
  formData.append('stationID', stationID);
  formData.append('itemName', itemName);

  // Replace with your actual Apps Script Web App URL:
  await fetch('https://script.google.com/macros/s/AKfycbwjZ0On3VVZSUetSOUdCW86qi2wDMgVvxanp737jveV_ynkHoGjaI6EyA96cNM-DCNUSA/exec', {
    method: 'POST',
    mode: 'no-cors',
    body: formData
  });
}

