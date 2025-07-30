import { db, auth } from "./firebass.js";
import {
  doc, getDoc, setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const loginForm = document.getElementById("login-form");
const adminUI = document.getElementById("admin-ui");
const stationSelect = document.getElementById("station-select");
const itemList = document.getElementById("item-list");
const addItemBtn = document.getElementById("add-item");
const saveBtn = document.getElementById("save-btn");

const STATIONS = [
  "AD STATION 1", "AD STATION 2", "AD STATION 3",
  "DL STATION 1", "DL STATION 2", "DL STATION 3",
  "CR STATION 1", "CC STATION 1", "WR STATION 1"
];

// Populate station dropdown
STATIONS.forEach(station => {
  const opt = document.createElement("option");
  opt.value = station;
  opt.textContent = station;
  stationSelect.appendChild(opt);
});

// Handle login
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
    loginForm.style.display = "none";
    adminUI.style.display = "block";
  } catch (err) {
    alert("Login failed: " + err.message);
  }
});

// Load items when station changes
stationSelect.addEventListener("change", async () => {
  const stationId = stationSelect.value;
  const ref = doc(db, "stations", stationId);
  const snap = await getDoc(ref);
  const data = snap.exists() ? snap.data().items : [];

  itemList.innerHTML = "";
  data.forEach((item, i) => renderItem(item, i));
});

// Render an item row
function renderItem(item, index) {
  const li = document.createElement("li");
  li.innerHTML = `
    <input id="name-${index}" value="${item.name}" placeholder="Name" />
    <input id="brand-${index}" value="${item.brand}" placeholder="Brand" />
    <input id="color-${index}" value="${item.color}" placeholder="Color" />
    <input id="qty-${index}" type="number" value="${item.quantity}" placeholder="Quantity" />
  `;
  itemList.appendChild(li);
}

// Add blank item
addItemBtn.addEventListener("click", () => {
  const index = itemList.children.length;
  renderItem({ name: "", brand: "", color: "", quantity: 1 }, index);
});

// Save to Firebase
saveBtn.addEventListener("click", async () => {
  const stationId = stationSelect.value;
  const items = [...itemList.children].map((li, i) => ({
    name: li.querySelector(`#name-${i}`).value,
    brand: li.querySelector(`#brand-${i}`).value,
    color: li.querySelector(`#color-${i}`).value,
    quantity: parseInt(li.querySelector(`#qty-${i}`).value),
  }));
  await setDoc(doc(db, "stations", stationId), { items });
  alert("Saved successfully!");
});
