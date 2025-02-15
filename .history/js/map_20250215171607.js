// See the official Google Map documentation here:
// https://developers.google.com/maps/documentation/javascript/overview

let map;
let markers = [];
let currentInfoWindow = null;

// Initialize the map and load markers
async function initMap() {
    locations = await loadLocationsData();
    
    // Create the map
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 43.2387, lng: -79.8881 },
        zoom: 12,
        mapId: "Assignment_2_MAP_APPLICATION",
    });
    map.addListener("click", () => {
        if (currentInfoWindow) {
            currentInfoWindow.close();
        }
    });

    for (const store in locations) {
        if (locations.hasOwnProperty(store)) {
            let storeData = locations[store];
            if (!storeData.locations) {
                console.warn(`No locations found for ${store}`);
                continue;
            }
            generateLocations(storeData, store);
        }
    }
}

async function loadLocationsData() {
    try {
        const response = await fetch("json/location-info.json");
        if (!response.ok) {
            console.error("Error loading JSON:", response.statusText);
            return [];
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching JSON:", error);
        return [];
    }
}

function handleButton(filter) {
    markers.forEach(marker => {
        if (marker.storeType.toLowerCase() === filter.toLowerCase() || filter.toLowerCase() === "all") {
            marker.setMap(map);
        } else {
            marker.setMap(null);
        }
    });
}

function generateLocations(storeData, store) {
    for (const locationName in storeData.locations) {
        if (storeData.locations.hasOwnProperty(locationName)) {
            let locationData = storeData.locations[locationName];

            let position = locationData.position;
            if (typeof position === "string") {
                const [lat, lng] = position.split(",").map(Number);
                position = { lat, lng };
            }
            const marker = new google.maps.marker.AdvancedMarkerElement({
                position: position,
                map: map,
                title: `${store} - ${locationName}`,
            });
            marker.storeType = store;
            markers.push(marker);

            const infoWindow = new google.maps.InfoWindow({
                content: `
                    <div id="info-window-content">
                        <div id="info-window-header">
                            <img src="${storeData.icon}" alt="${store} - ${locationName}">
                            <h2>${store} - ${locationName}</h2>
                        </div>
                        <p>${storeData.message}</p>
                        <p>Address: <a href="${locationData.link}" target="_blank">${locationData.address}</a></p>
                        <p>Visit their website: <a href="${storeData.website}" target="_blank">${store}</a></p>
                    </div>
                `,
            });

            marker.addListener("click", () => {
                if (currentInfoWindow) {
                    currentInfoWindow.close();
                }
                infoWindow.open({
                    anchor: marker,
                    map: map,
                    shouldFocus: false,
                });
                currentInfoWindow = infoWindow;
            });
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".btn").forEach(button => {
        button.addEventListener("click", function () {
            const filter = this.textContent.replace("Show ", "").replace(" Stores", "").trim();
            handleButton(filter);
        });
    });
});
