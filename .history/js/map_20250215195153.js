// See the official Google Map documentation here:
// https://developers.google.com/maps/documentation/javascript/overview

let map;
let markers = [];
let currentInfoWindow = null;
let userMarkers = []; 
let locations = {};
let geocoder;

// Initialize the map and load markers
async function initMap() {
    geocoder = new google.maps.Geocoder();
    locations = await loadLocationsData();
    
    // Create the map
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 43.271914280548835, lng:-79.88844092878001},
        zoom: 11,
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
    updateLocationsList();
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
            marker.address = locationData.address;
            marker.link = locationData.link;
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
    updateLocationsList();
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
    const userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
    map.setCenter(userLocation);
    const icon_content = document.createElement("img");
    icon_content.src = "https://maps.google.com/mapfiles/kml/paddle/red-circle.png";
    // create a marker centered at the user's location
    let user_location = new google.maps.marker.AdvancedMarkerElement({
    map: map,
    position: {
        lat: position.coords.latitude, 
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
                map: map,
                title: title
            });
            marker.address = address;
            marker.link = "#";
            marker.isCustom = true;
            userMarkers.push(marker);
            updateLocationsList();
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

function updateLocationsList() {
    let locationsList = document.getElementById("locationsList");
    locationsList.innerHTML = ""; // Clear the existing list

    let storeGroups = {}; // Object to categorize locations by store type

    // Group markers by store type
    markers.concat(userMarkers).forEach(marker => {
        let storeType, locationName;
        if (marker.isCustom) {
            storeType = "Custom Markers";
            locationName = marker.title;
        } else [storeType, locationName] = marker.title.split(" - ");
        

        if (!storeGroups[storeType]) storeGroups[storeType] = [];
        storeGroups[storeType].push({ 
            name: locationName, 
            lat: marker.position.lat, 
            lng: marker.position.lng, 
            address: marker.address, 
            link: marker.link 
        });
    });

    for (const store in storeGroups) {
        let storeSection = document.createElement("div");
        storeSection.classList.add("mb-2");
        storeSection.innerHTML = `
            <button class="btn btn-secondary w-100 text-start" data-bs-toggle="collapse" data-bs-target="#collapse-${store.replace(/\s+/g, '')}">
                ${store}
            </button>
            <ul id="collapse-${store.replace(/\s+/g, '')}" class="list-group collapse">
            </ul>
        `;

        let storeList = storeSection.querySelector("ul");
        storeGroups[store].forEach(location => {
            let listItem = document.createElement("li");
            listItem.classList.add("list-group-item");
            listItem.innerHTML = `<strong>${location.name}</strong> <br> <span class="listed-item-address">Address: <a href="${location.link}" target="_blank">${location.address}</a></span>`;
            storeList.appendChild(listItem);
        });

        locationsList.appendChild(storeSection);
    }
}

function updateRouteDropdowns() {
    // Get the dropdown elements
    const originSelect = document.getElementById('origin');
    const destinationSelect = document.getElementById('destination');
    
    // Clear any existing options (except for the placeholder)
    originSelect.innerHTML = '<option value="" disabled selected>Select Origin</option>';
    destinationSelect.innerHTML = '<option value="" disabled selected>Select Destination</option>';
    
    // Combine all markers (regular and custom)
    const allMarkers = markers.concat(userMarkers);
    
    // Loop through markers and add an option for each
    allMarkers.forEach(marker => {
        const optionText = marker.title; // You can customize what to display here
        const optionValue = `${marker.position.lat},${marker.position.lng}`;
        
        // Create option for origin
        const originOption = document.createElement('option');
        originOption.value = optionValue;
        originOption.textContent = optionText;
        originSelect.appendChild(originOption);
        
        // Create option for destination
        const destinationOption = document.createElement('option');
        destinationOption.value = optionValue;
        destinationOption.textContent = optionText;
        destinationSelect.appendChild(destinationOption);
    });
}





  
// call the codeAddress function when the geolocate button is clicked
document.getElementById("markerForm").addEventListener("submit", codeAddress);
