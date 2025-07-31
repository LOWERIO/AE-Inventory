const query = window.location.search

const url = new URLSearchParams(query)

const stationType = url.get('type')

const stationID = url.get('id')

function display_DB_INFO(){
    const display = document.getElementById("display_DB_sts")
    const info = document.createElement("h1");
    info.textContent = "Estação " + stationType + " " + stationID + " a ser verificada!"
    display.append(info)
}



display_DB_INFO()