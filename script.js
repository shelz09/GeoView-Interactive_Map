const map = L.map('map').setView([28.619024668775726, 77.16570532820474], 11);
const SearchInput = document.getElementById("srchInput");
const SearchBtn = document.getElementById("searchBtn");
let nearbyMarkers = [];
const filterBtn = document.getElementById("filter-menu");
const sidebar = document.querySelector(".menu-sidebar");

SearchBtn.addEventListener('click', HandleSearch)
filterBtn.addEventListener('click', HandleSidebar);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
, minZoom:3}).addTo(map);

map.locate({ setView: true, maxZoom: 19 });

map.on('locationfound', function (e) {
    const userMarker = L.marker(e.latlng).addTo(map)
        .bindPopup("You are here").openPopup();

    // Optional: add a circle around the location
    L.circle(e.latlng, {
        radius: e.accuracy,
        color: '#136aec',
        fillColor: '#136aec',
        fillOpacity: 0.15
    }).addTo(map);
});

map.on('locationerror', function (e) {
    alert("Location access denied or unavailable.");
});
// Predefined markers
L.marker([28.613025264701285, 77.2295272739154]).addTo(map).bindPopup('India Gate');
L.marker([28.553388312756734, 77.25861181764705]).addTo(map).bindPopup('Lotus Temple');
L.marker([30.75200130369803, 76.81004867686569]).addTo(map).bindPopup('Rock Garden');
L.marker([18.922136318098524, 72.83465429397998]).addTo(map).bindPopup('Gateway of India');
L.marker([22.585454371329465, 88.34679311512767]).addTo(map).bindPopup('Howrah Bridge');

let marker; // for search result

function HandleSearch() {
    const prompt = SearchInput.value.trim();
    if (!prompt) return;

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(prompt)}`;

    fetch(url, {
        headers: {
            'Accept': 'application/json',
            'User-Agent': 'LeafletMapSearchExample/1.0 (choudharyshlesh1109@email.com)'
        }
    }).then(response => response.json()).then(data => {
    if (data.length > 0) {
            const place = data[0];
            const lat = parseFloat(place.lat);
            const lon = parseFloat(place.lon);
            const displayName = place.display_name;

            
            map.setView([lat, lon], 12);

            
            if (marker) {
                marker.setLatLng([lat, lon]);
            } else {
                marker = L.marker([lat, lon]).addTo(map);
            }

            
            fetch(`https://en.wikipedia.org/w/api.php?origin=*&action=query&titles=${encodeURIComponent(prompt)}&prop=pageimages&format=json&pithumbsize=300`)
                .then(res => res.json())
                .then(wikiData => {
                    const pages = wikiData.query.pages;
                    const page = Object.values(pages)[0];

                    let imageHtml = '';
                    if (page.thumbnail && page.thumbnail.source) {
                        imageHtml = `<br><img src="${page.thumbnail.source}" alt="${prompt}" style="max-width:100%; height:auto;">`;
                    }

                    marker.bindPopup(`<strong>${displayName}</strong>${imageHtml}`).openPopup();
                })
                .catch(() => {
                    // Show only name if image fails
                    marker.bindPopup(`<strong>${displayName}</strong>`).openPopup();
                });
        } else {
            alert('Place not found.');
        }
    })
    .catch(err => {
        console.error('Geocoding error:', err);
    });
}


function findNearby(type) {
    sidebar.classList.toggle("slide")
    if (!map.getCenter()) return alert("Map is not ready.");

    // Clear previous nearby markers
    nearbyMarkers.forEach(m => map.removeLayer(m));
    nearbyMarkers = [];

    const center = map.getCenter();
    const lat = center.lat;
    const lon = center.lng;

    const radius = 5000; // in meters

    const query = `
        [out:json];
        (
            node["amenity"="${type}"](around:${radius},${lat},${lon});
            way["amenity"="${type}"](around:${radius},${lat},${lon});
            relation["amenity"="${type}"](around:${radius},${lat},${lon});
        );
        out center;
    `;

    const url = "https://overpass-api.de/api/interpreter";

    fetch(url, {
        method: "POST",
        body: query,
        headers: {
            "Content-Type": "text/plain"
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.elements.length === 0) {
            alert(`No ${type}s found nearby.`);
            return;
        }

        data.elements.forEach(el => {
            const lat = el.lat || el.center?.lat;
            const lon = el.lon || el.center?.lon;
            const name = el.tags?.name || type.charAt(0).toUpperCase() + type.slice(1);

            if (lat && lon) {
                const m = L.marker([lat, lon])
                    .addTo(map)
                    .bindPopup(`<strong>${name}</strong><br>Type: ${type}`).openPopup();
                nearbyMarkers.push(m);
            }
        });
    })
    .catch(err => {
        console.error("Overpass error:", err);
        alert("Error fetching nearby places.");
    });

}
map.on('click', function (e) {
    
    if (e.originalEvent.target.tagName === 'IMG' || e.originalEvent.target.classList.contains('leaflet-marker-icon')) {
        return;
    }

    
    nearbyMarkers.forEach(m => map.removeLayer(m));
    nearbyMarkers = [];

    if (marker) {
        map.removeLayer(marker);
        marker = null;
    }
});
function HandleSidebar(){
    sidebar.classList.toggle("slide")
}

