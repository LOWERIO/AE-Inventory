import { db, auth } from "./firebase.js";
import {
  ref,
  get,
  set
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const query = window.location.search

const url = new URLSearchParams(query)

const stationID = url.get('id')

async function loadStationItems(stationId) {
  if (!stationID) return;

  const stationRef = ref(db, `stations/${stationID}`);
  const snap = await get(stationRef);
  const data = snap.exists() ? snap.val().items || [] : [];


  console.log(data);

}


function display_DB_INFO(){
    const display = document.getElementById("display_DB_sts")
    const info = document.createElement("h1");
    info.textContent = "Estação " + stationID + " a ser verificada!"
    display.append(info)
}



display_DB_INFO()

loadStationItems(stationID)
