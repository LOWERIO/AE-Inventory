import { db, auth } from "./firebase.js";
import {
  ref,
  get,
  set
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const query = window.location.search;
const url = new URLSearchParams(query);
const stationID = url.get('id');



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
    if (row[0] && row[0].includes(stationID)) {
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

  if (firebaseItems.length === 0 && sheetItems.length === 0) {
    display.innerHTML += `<p>Nenhum item encontrado.</p>`;
    return;
  }

  display.innerHTML += `
    <div style="display: grid; grid-template-columns: repeat(5, 1fr); font-weight: bold; gap: 8px; margin-bottom: 8px;">
      <div>Nome</div>
      <div style='text-align: center;'>Quantidade</div>
      <div>Marca</div>
      <div>Cor</div>
      <div>Ações</div>
    </div>
  `;

  firebaseItems.forEach((item, idx) => {
    const name = (item.name || '').trim();
    const quantity = String(item.quantity || '').trim();
    const brand = (item.brand || '').trim();
    const color = (item.color || '').trim();

    const matchingSheetItem = sheetItems.find(sheetItem => {
      return (sheetItem.name || '').trim().toLowerCase() === name.toLowerCase();
    });

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


    const isInvalid = !nameValid || !qtyValid || !brandValid || !colorValid;
    const btnId = `sheets-${idx}`;

    display.innerHTML += `
      <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 4px;">
        <div class="${nameValid ? 'valid' : 'invalid'}">${displayName}</div>
        <div class="${qtyValid ? 'valid' : 'invalid'} qty">${displayQuantity}</div>
        <div class="${brandValid ? 'valid' : 'invalid'}">${displayBrand}</div>
        <div class="${colorValid ? 'valid' : 'invalid'}">${displayColor}</div>
        <div>
          ${isInvalid ? `<button id="${btnId}">Sheets</button>` : ''}
        </div>
      </div>
    `;

    // Attach event listener after rendering
    setTimeout(() => {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.onclick = async () => {
          // Check auth
          if (!auth.currentUser) {
            // Prompt sign-in (popup)
            const provider = new firebase.auth.GoogleAuthProvider();
            try {
              await auth.signInWithPopup(provider);
            } catch (e) {
              alert("Login failed.");
              return;
            }
          }
          // Call backend endpoint to update Google Sheets
          try {
            sendItemToSheets(item, stationID);
            showNotification("Item enviado para o Sheets com sucesso!");
          } catch (e) {
            showNotification("Erro ao enviar para o Sheets.", "error");
          }
        };
      }
    }, 0);
  });
}


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


async function sendItemToSheets(item, stationID) {
  const formData = new FormData();
  formData.append('item', JSON.stringify(item));
  formData.append('stationID', stationID);

  await fetch('https://script.google.com/macros/s/AKfycbxLZES9i12tk_ecCLFhdzt2OrEjT_lB0ZjPoHpbD8QopmM8200G6p0CegpuRP-rc_2nkQ/exec', {
    method: 'POST',
    mode: 'no-cors',
    body: formData
  });

  window.location.reload();

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
