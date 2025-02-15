// See the official Google Map documentation here:
// https://developers.google.com/maps/documentation/javascript/overview

let map;
let markers = [];
let currentInfoWindow = null;
let userMarkers = []; 

// Initialize the map and load markers
async function initMap() {
    geocoder = new google.maps.Geocoder();
    locations = await loadLocationsData();
    
    // Create the map
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 43.271914280548835, lng:-79.88844092878001},
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

function handleButton(filter) {
    markers.forEach(marker => {
        if (marker.storeType.toLowerCase() === filter.toLowerCase() || filter.toLowerCase() === "all") {
            marker.setMap(map);
        } else {
            marker.setMap(null);
        }
    });
}

function showPositionOnMap(position){
 
    // We use a custom marker:
    //   https://developers.google.com/maps/documentation/javascript/custom-markers
    // A list of icons we can use is found here:
    //   http://kml4earth.appspot.com/icons.html
    const icon_content = document.createElement("img");
    icon_content.src = "https://maps.google.com/mapfiles/kml/paddle/red-circle.png";
    map.setCenter(position.coords.latitude, position.coords.longitude);
    // create a marker centered at the user's location
    let user_location = new google.maps.marker.AdvancedMarkerElement({
    map: map,
    position: { lat: position.coords.latitude, 
                lng: position.coords.longitude
                },
    title: "Your Location",
    content: icon_content
    });
}


// call showPositionOnMap after finding the user's current location
document.getElementById("geolocate").addEventListener("click",() =>{
    navigator.geolocation.getCurrentPosition(showPositionOnMap);
});

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".btn").forEach(button => {
        button.addEventListener("click", function () {
            const filter = this.textContent.replace("Show ", "").replace(" Stores", "").trim();
            handleButton(filter);
        });
    });
});


function codeAddress(e) {
    e.preventDefault();
    let address = document.getElementById('address').value;
    let title = document.getElementById('title').value;

    // perform geocoding for the address entered into the input textbox, a 
    // callback function is given the latitude and longitude as an an 
    // argument as part of a results object..
    geocoder.geocode( { 'address': address}, function(results, status) {
        if (status == 'OK') {
            
            // we could center the map at the location
            map.setCenter(results[0].geometry.location);
                        
            // put a marker on the map at the given position
            const marker = new google.maps.marker.AdvancedMarkerElement({
                position: results[0].geometry.location,
                map: map
            });
            userMarkers.push(marker);
            const infoWindow = new google.maps.InfoWindow({
                content: `
                    <div>
                        <h3>${title}</h3>
                        <p>Address: ${address}</p>
                    </div>
                `
            });

            marker.addListener("click", () => {
                infoWindow.open({
                    anchor: marker,
                    map: map,
                });
            });
            document.getElementById("markerForm").reset();
        } else {
            alert('Geocode was not successful for the following reason: ' + status);
        }
    });
  }
  
// call the codeAddress function when the geolocate button is clicked
document.getElementById("markerForm").addEventListener("submit", codeAddress);
