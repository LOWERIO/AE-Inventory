import { db, auth } from "./firebase.js";
import {
  ref,
  get,
  set
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const query = window.location.search;
const url = new URLSearchParams(query);
const stationID = url.get('id');


const notificationContainer = document.getElementById("notification-container");



async function loadStationItems(stationID) {
  if (!stationID) return [];

  const stationRef = ref(db, `stations/${stationID}`);
  const snap = await get(stationRef);
  const data = snap.exists() ? snap.val().items || [] : [];

  console.log("Itens carregados do Firebase:", data);
  return data;
}

async function fetchStationItemsFromSheet(stationID) {
  const sheetURL = 'https://docs.google.com/spreadsheets/d/1ypvAsg6eFpVN21lAOvIwbHhM4y9Dk5BbxFXLl8Eb-Go/gviz/tq?tqx=out:csv';

  const response = await fetch(sheetURL);
  const csv = await response.text();

  const rows = csv.split('\n').map(row => row.split(','));

  const matchingItems = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (
      row[0] &&
      row[0].includes(stationID)
    ) {
      matchingItems.push({
        name: extractName(row[0]).replace(/"\d.+- (.+)/, '$1') || '',
        quantity: row[1] || '',
        brand: row[2] || '',
        color: row[3] || ''
      });
    }
  }

  console.log("Itens carregados do Sheets:", matchingItems);
  return matchingItems;
}

function extractName(fullString) {
  if (!fullString) return '';

  let name = fullString.replace(/"\d - /, '');

  name = name.replace(/\w\w.STATION.*/i, '').trim();
  return name;
}

function isEmptyOrWhitespace(str) {
  return !str || str.trim().length === 0;
}

function displayCombinedItems(firebaseItems, sheetItems) {
  const display = document.getElementById("display_DB_itms");
  const missingDiv = document.getElementById("missing_items") || (() => {
    const div = document.createElement("div");
    div.id = "missing_items";
    div.innerHTML = `<h2>Itens em Falta</h2><div id="missing_list"></div>`;
    display.parentElement.appendChild(div);
    return div;
  })();
  const missingList = missingDiv.querySelector("#missing_list");
  missingList.innerHTML = "";

  if (firebaseItems.length === 0 && sheetItems.length === 0) {
    display.innerHTML += `<p>Nenhum item encontrado.</p>`;
    missingList.innerHTML = `<p>Nenhum item em falta.</p>`;
    return;
  }

  // Find items missing in Sheets (present in DB but not in Sheets)
  const missingInSheets = firebaseItems.filter(dbItem =>
    !sheetItems.some(sheetItem =>
      (sheetItem.name || '').trim().toLowerCase() === (dbItem.name || '').trim().toLowerCase()
    )
  );

  // Find items missing in DB (present in Sheets but not in DB)
  const missingInDB = sheetItems.filter(sheetItem =>
    !firebaseItems.some(dbItem =>
      (dbItem.name || '').trim().toLowerCase() === (sheetItem.name || '').trim().toLowerCase()
    )
  );

  // Main table header
  display.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(5, 1fr); font-weight: bold; gap: 8px; margin-bottom: 8px;">
      <div>Nome</div>
      <div style='text-align: center;'>Quantidade</div>
      <div>Marca</div>
      <div>Cor</div>
      <div>Ações</div>
    </div>
  `;

  // Show all DB items, with "Sheets" button if missing/invalid in Sheets
  firebaseItems.forEach((item, idx) => {
    const name = (item.name || '').trim();
    const quantity = String(item.quantity || '').trim();
    const brand = (item.brand || '').trim();
    const color = (item.color || '').trim();

    const matchingSheetItem = sheetItems.find(sheetItem =>
      (sheetItem.name || '').trim().toLowerCase() === name.toLowerCase()
    );

    let sheetQuantity = String(matchingSheetItem?.quantity || '').trim();
    let sheetBrand = (matchingSheetItem?.brand || '').trim();
    let sheetColor = (matchingSheetItem?.color || '').trim();

    sheetQuantity = sheetQuantity.replaceAll(/"/g, '');
    sheetBrand = sheetBrand.replaceAll(/"/g, '');
    sheetColor = sheetColor.replaceAll(/"/g, '');

    const nameValid = matchingSheetItem !== undefined;
    const qtyValid = matchingSheetItem ? quantity.toLowerCase() === sheetQuantity.toLowerCase() : false;
    const brandValid = matchingSheetItem ? brand.toLowerCase() === sheetBrand.toLowerCase() : false;
    const colorValid = matchingSheetItem ? color.toLowerCase() === sheetColor.toLowerCase() : false;

    const displayName = isEmptyOrWhitespace(name) ? '<span style="color:red;">*</span>' : name;
    const displayQuantity = isEmptyOrWhitespace(quantity) ? '<span style="color:red;">*</span>' : quantity;
    const displayBrand = isEmptyOrWhitespace(brand) ? '<span style="color:red;">*</span>' : brand;
    const displayColor = isEmptyOrWhitespace(color) ? '<span style="color:red;">*</span>' : color;

    // If missing in Sheets or any field is invalid, show button
    const isInvalid = !nameValid || !qtyValid || !brandValid || !colorValid;
    const btnId = `send-to-sheets-${idx}`;

    const rowStyle = !nameValid ? "background: #ffe5e5; color: #b30000;" : "";

    display.innerHTML += `
      <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 4px; ${rowStyle}">
        <div class="${nameValid ? 'valid' : 'invalid'}">${displayName}</div>
        <div class="${qtyValid ? 'valid' : 'invalid'} qty">${displayQuantity}</div>
        <div class="${brandValid ? 'valid' : 'invalid'}">${displayBrand}</div>
        <div class="${colorValid ? 'valid' : 'invalid'}">${displayColor}</div>
        <div>
          ${isInvalid ? `<button id="${btnId}">Sheets</button>` : ''}
        </div>
      </div>
    `;

    setTimeout(() => {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.onclick = () => sendItemToSheets(item, stationID);
      }
    }, 0);
  });

  // Show all items missing in DB, with "DB" button
  missingInDB.forEach((item, idx) => {
    const btnId = `send-to-db-${idx}`;
    display.innerHTML += `
      <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 4px; background: #ffe5e5; color: #b30000;">
        <div class="invalid">${item.name}</div>
        <div class="invalid">${item.quantity}</div>
        <div class="invalid">${item.brand}</div>
        <div class="invalid">${item.color}</div>
        <div>
          <button id="${btnId}">DB</button>
        </div>
      </div>
    `;
    setTimeout(() => {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.onclick = () => sendItemToDB(item, stationID);
      }
    }, 0);
  });

  // Fill "Itens em Falta" section using only divs and grid layout
  missingList.innerHTML = "";

  if (missingInSheets.length === 0 && missingInDB.length === 0) {
    missingList.innerHTML = `<p>Nenhum item em falta.</p>`;
  } else {
    if (missingInSheets.length > 0) {
      missingList.innerHTML += `<div style="font-weight:bold; margin-top:8px;">Em falta no Sheets:</div>`;
      missingInSheets.forEach(item => {
        missingList.innerHTML += `
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; background: #ffe5e5; color: #b30000; margin-bottom: 4px;">
            <div class="invalid">${item.name}</div>
            <div class="invalid">${item.quantity}</div>
            <div class="invalid">${item.brand}</div>
            <div class="invalid">${item.color}</div>
          </div>
        `;
      });
    }
    if (missingInDB.length > 0) {
      missingList.innerHTML += `<div style="font-weight:bold; margin-top:12px;">Em falta na Base de Dados:</div>`;
      missingInDB.forEach(item => {
        missingList.innerHTML += `
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; background: #ffe5e5; color: #b30000; margin-bottom: 4px;">
            <div class="invalid">${item.name}</div>
            <div class="invalid">${item.quantity}</div>
            <div class="invalid">${item.brand}</div>
            <div class="invalid">${item.color}</div>
          </div>
        `;
      });
    }
  }
}



async function sendItemToSheets(item, stationID) {
  const formData = new FormData();
  formData.append('shname', 'ADMIN OFFICE');
  formData.append('item', JSON.stringify(item));
  formData.append('stationID', stationID);

  await fetch('https://script.google.com/macros/s/AKfycbyVobnVtPdmVdR-X_UY_GtsGrsBhu3GKqO55IFmOahZ-x6NZ8J4zMvMZLjAVOkBRpcSyw/exec', {
    method: 'POST',
    mode: 'no-cors',
    body: formData
  });

  window.location.reload();

}

async function sendItemToDB(item, stationID) {
  try {
    // Get current items from Firebase
    const stationRef = ref(db, `stations/${stationID}`);
    const snap = await get(stationRef);
    const data = snap.exists() ? snap.val().items || [] : [];

    // Add the new item
    data.push({
      name: item.name,
      quantity: parseInt(item.quantity) || 1,
      brand: item.brand.replaceAll('"', '') || "",
      color: item.color.replaceAll('"', '') || ""
    });

    // Save back to Firebase
    await set(stationRef, { items: data, updatedAt: Date.now() });

    setTimeout(() => window.location.reload(), 1000);
  } catch (err) {
    console.error("Erro ao enviar item para a Base de Dados:", err);
  }
}

function display_DB_INFO() {
  const display = document.getElementById("display_DB_sts");
  const info = document.createElement("h1");
  info.textContent =stationID;
  display.append(info);
}

async function loadAndCompareItems(stationID) {
  display_DB_INFO();

  const firebaseItems = await loadStationItems(stationID);
  const sheetItems = await fetchStationItemsFromSheet(stationID);

  displayCombinedItems(firebaseItems, sheetItems);
}

loadAndCompareItems(stationID);
