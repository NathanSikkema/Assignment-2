// See the official Google Map documentation here:
// https://developers.google.com/maps/documentation/javascript/overview

let map;

// The initMap() function will be called when the above Google Maps JS
// library finishes loading.  Notice the URL parameter callback=initMap,
// this is how the library knows to call this initMap function when it 
// is done loading.  We could change the name of the function in that 
// URL if we wanted to call it something different.
async function initMap()
{

    // This will create a new Google Map object, and the variable map will 
    // contain a reference to the object.  The first argument is the element 
    // to place the map into, and the 2nd argument is a JSON with keys and 
    // objects describing how to make the map.  At a minimum we need to 
    // provide center and zoom values as part of this object.  The mapId 
    // will be needed if we want to use features like markers, technically
    // we could leave it off this example and it would still work!


    map = new google.maps.Map(document.getElementById("map"), 
    {center: { lat: 43.2387, lng: -79.8881 },
        zoom: 12,
        mapId: "Assignment_2_MAP_APPLICATION"
    });

    locations = await loadLocations()
    markers = []
    // console.log(locations);
    for (let i = 0; i < locations.length; i++) {
        const location = locations[i];

        console.log(location);
        const marker = new google.maps.marker.AdvancedMarkerElement({
            position: location,
            map: map,
        });
        markers.push(marker);
    }
    let mohawkloc = { lat: 43.2387, lng: -79.8881 };
    mohawk_marker = new google.maps.marker.AdvancedMarkerElement({
        map: map,
        position: mohawkloc,
        title: "Mohawk College",  // will appear when we hover over the marker
    });
}
async function loadLocations(){
    try {
        const response = await fetch('json/location-info.json');
        if (!response.ok) {
            console.error('Error loading JSON:', response.statusText);
            return [];
        }
        const data = await response.json();
        // console.log(data);
        return data;
    } catch (error) {
        console.error('Error fetching JSON:', error);
        return [];
    }
}
