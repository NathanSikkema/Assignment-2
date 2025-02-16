// See the official Google Map documentation here:
// https://developers.google.com/maps/documentation/javascript/overview

let map;
let markers = [];
let currentInfoWindow = null;
let userMarkers = []; 
let locations = {};
let geocoder;
let directionsService;
let directionsRenderer;
let userLocationSet = false;

// Initialize the map and load markers
async function initMap() {
    geocoder = new google.maps.Geocoder();
    locations = await loadLocationsData();
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    
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
    
    directionsRenderer.setMap(map);
    

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

async function showPositionOnMap(position) {
    const userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
    map.setCenter(userLocation);
    const icon_content = document.createElement("img");
    icon_content.src = "https://maps.google.com/mapfiles/kml/paddle/red-circle.png";
    
    // create a marker centered at the user's location
    let user_location = new google.maps.marker.AdvancedMarkerElement({
      map: map,
      position: userLocation,
      title: "Your Location",
      content: icon_content
    });
    const address = await getNearestAddress(userLocation);
    if (address) {
        user_location.address = address;
        console.log("User's nearest address:", address);
    } else {
        user_location.address = "Unknown address";
        console.log("Address not found.");
    }
    user_location.link = "#";
    user_location.isCustom = true;
    if (!userLocationSet) {
        userMarkers.push(user_location);
        userLocationSet = true;
        updateLocationsList();
    }
  }
  
async function getNearestAddress(latlng) {
    return new Promise((resolve, reject) => {
        geocoder.geocode({ location: latlng }, function(results, status) {
            if (status === "OK") {
                if (results[0]) {
                    // Resolve the Promise with the formatted address
                    resolve(results[0].formatted_address);
                } else {
                    console.log("No results found");
                    resolve(null);
                }
            } else {
                console.log("Geocoder failed due to: " + status);
                resolve(null);
            }
        });
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
    locationsList.innerHTML = "";

    let storeGroups = {};

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
        storeList.addListener("click", function (e) {
            
        
        });
        storeGroups[store].forEach(location => {
            let listItem = document.createElement("li");
            listItem.classList.add("list-group-item");
            listItem.innerHTML = `<strong>${location.name}</strong> <br> <span class="listed-item-address">Address: <a href="${location.link}" target="_blank">${location.address}</a></span>`;
            storeList.appendChild(listItem);
        });

        locationsList.appendChild(storeSection);
    }
    updateRouteDropdowns();
}

function updateRouteDropdowns() {
    const originSelect = document.getElementById('origin');
    const destinationSelect = document.getElementById('destination');
    
    originSelect.innerHTML = '<option value="" disabled selected>Select Origin</option>';
    destinationSelect.innerHTML = '<option value="" disabled selected>Select Destination</option>';
    
    const allMarkers = markers.concat(userMarkers);
    
    allMarkers.forEach(marker => {
        const optionText = marker.title;
        const optionValue = `${marker.position.lat},${marker.position.lng}`;
        
        const originOption = document.createElement('option');
        originOption.value = optionValue;
        originOption.textContent = optionText;
        originSelect.appendChild(originOption);
        
        const destinationOption = document.createElement('option');
        destinationOption.value = optionValue;
        destinationOption.textContent = optionText;
        destinationSelect.appendChild(destinationOption);
    });
    
    originSelect.addEventListener("change", disableMatchingOptions);
    destinationSelect.addEventListener("change", disableMatchingOptions);
}

function disableMatchingOptions() {
    const originSelect = document.getElementById('origin');
    const destinationSelect = document.getElementById('destination');
    
    const selectedOrigin = originSelect.value;
    const selectedDestination = destinationSelect.value;
    
    Array.from(destinationSelect.options).forEach(option => {
        option.disabled = false;
        if (selectedOrigin && option.value === selectedOrigin) {
            option.disabled = true;
        }
    });
    
    Array.from(originSelect.options).forEach(option => {
        option.disabled = false;
        if (selectedDestination && option.value === selectedDestination) {
            option.disabled = true;
        }
    });
}

function handleDirections() {

    const origin = document.getElementById('origin').value;
    const destination = document.getElementById('destination').value;
    // setup a basic directions request with origin, destination, travel mode,
    // there are MANY more possible options here
    if (!origin || !destination) {
        alert("Please select both an origin and a destination.");
        return;
    }
    request = {
        origin: origin,
        destination: destination,
        travelMode: 'DRIVING'
    };

    // use the directions service and directions renderer to render the 
    // directions on the map
    directionsService.route(request, function(result, status) {
        if (status == 'OK') directionsRenderer.setDirections(result);
        else alert("Directions request failed due to " + status);
    });
}
// call the codeAddress function when the geolocate button is clicked
document.getElementById("markerForm").addEventListener("submit", codeAddress);
