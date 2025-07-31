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
        name: extractName(row[0]) || '',
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

  name = name.replace(/\s*AD STATION.*$/i, '').trim();
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

  // Header row
  display.innerHTML += `
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); font-weight: bold; gap: 8px; margin-bottom: 8px;">
      <div>Nome</div>
      <div>Quantidade</div>
      <div>Marca</div>
      <div>Cor</div>
    </div>
  `;

  firebaseItems.forEach(item => {
    const name = (item.name || '').trim();
    const quantity = String(item.quantity || '').trim();
    const brand = (item.brand || '').trim();
    const color = (item.color || '').trim();

    // Find the matching sheet item by name (case-insensitive)
    const matchingSheetItem = sheetItems.find(sheetItem => {
      return (sheetItem.name || '').trim().toLowerCase() === name.toLowerCase();
    });

    // Normalize sheet values for comparison
    let sheetQuantity = String(matchingSheetItem?.quantity || '').trim();
    let sheetBrand = (matchingSheetItem?.brand || '').trim();
    let sheetColor = (matchingSheetItem?.color || '').trim();

    // Remove any quotes from sheet values
    sheetQuantity = sheetQuantity.replaceAll(/"/g, '');
    sheetBrand = sheetBrand.replaceAll(/"/g, '');
    sheetColor = sheetColor.replaceAll(/"/g, '');

    // Compare each field, case-insensitive, trimmed
    const nameValid = matchingSheetItem !== undefined;

    const qtyValid = matchingSheetItem ? quantity.toLowerCase() === sheetQuantity.toLowerCase() : false;

    const brandValid = matchingSheetItem ? brand.toLowerCase() === sheetBrand.toLowerCase() : false;

    const colorValid = matchingSheetItem ? color.toLowerCase() === sheetColor.toLowerCase() : false;

    // Replace empty/whitespace-only values with red "-"
    const displayName = isEmptyOrWhitespace(name) ? '<span style="color:red;">*</span>' : name;
    const displayQuantity = isEmptyOrWhitespace(quantity) ? '<span style="color:red;">*</span>' : quantity;
    const displayBrand = isEmptyOrWhitespace(brand) ? '<span style="color:red;">*</span>' : brand;
    const displayColor = isEmptyOrWhitespace(color) ? '<span style="color:red;">*</span>' : color;

    display.innerHTML += `
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 4px;">
        <div class="${nameValid ? 'valid' : 'invalid'}">${displayName}</div>
        <div class="${qtyValid ? 'valid' : 'invalid'}">${displayQuantity}</div>
        <div class="${brandValid ? 'valid' : 'invalid'}">${displayBrand}</div>
        <div class="${colorValid ? 'valid' : 'invalid'}">${displayColor}</div>
      </div>
    `;
  });
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
