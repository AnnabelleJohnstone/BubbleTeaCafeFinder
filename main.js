let map;
let markers = [];

// Initialize Leaflet map (free alternative to Google Maps)
function initMap(lat, lng) {
  map = L.map('map').setView([lat, lng], 14);
  
  // Add OpenStreetMap tiles (free!)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);
}

// Get user location
function getLocation() {
  const cache = JSON.parse(localStorage.getItem("cachedLocation") || "{}");
  const now = Date.now();

  if (cache.timestamp && now - cache.timestamp < 10 * 60 * 1000) {
    useLocation(cache.lat, cache.lng);
  } else {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        localStorage.setItem('cachedLocation', JSON.stringify({ lat, lng, timestamp: now }));
        useLocation(lat, lng);
      },
      () => alert("Location access denied or unavailable.🥲🧋")
    );
  }
}

// Fetch cafes using Overpass API (completely free!)
async function useLocation(lat, lng) {
  initMap(lat, lng);
  
  // Search for cafes within 1.5km radius
  const radius = 1500;
  const query = `
    [out:json];
    (
      node["amenity"="cafe"](around:${radius},${lat},${lng});
      way["amenity"="cafe"](around:${radius},${lat},${lng});
    );
    out body;
  `;
  
  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query
    });
    
    const data = await response.json();
    const cafes = data.elements.map(cafe => ({
      name: cafe.tags?.name || 'Unnamed Cafe',
      lat: cafe.lat || cafe.center?.lat,
      lng: cafe.lon || cafe.center?.lon,
      cuisine: cafe.tags?.cuisine || '',
      opening_hours: cafe.tags?.opening_hours || 'Hours not available',
      id: cafe.id
    })).filter(cafe => cafe.lat && cafe.lng);
    
    if (cafes.length > 0) {
      displayCards(cafes);
      addMarkers(cafes);
    } else {
      alert("No cafes found nearby 😢");
    }
  } catch (error) {
    console.error("Error fetching cafes:", error);
    alert("Error finding cafes. Please try again.");
  }
}

// Display swipeable cards
function displayCards(cafes) {
  const container = document.querySelector(".cards");
  container.innerHTML = "";

  cafes.forEach((cafe, i) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'swipe-wrapper';
    wrapper.style.zIndex = 200 - i;

    const card = document.createElement('div');
    card.className = 'location-card';

    // Use a placeholder image (or you could use Unsplash API for free images)
    const imgUrl = `https://source.unsplash.com/400x300/?cafe,${encodeURIComponent(cafe.cuisine || 'coffee')}`;

    const cafeData = {
      name: cafe.name,
      id: cafe.id,
      photo: imgUrl,
      hours: cafe.opening_hours,
      lat: cafe.lat,
      lng: cafe.lng
    };

    card.innerHTML = `
      <img src="${imgUrl}" alt="${cafe.name}" />
      <h3>${cafe.name}</h3>
      <p>🕐 ${cafe.opening_hours}</p>
      <p><small>Swipe right to save 💖</small></p>
    `;

    wrapper.appendChild(card);
    container.appendChild(wrapper);

    const hammertime = new Hammer(wrapper);
    hammertime.on("swipeleft", () => {
      wrapper.style.transform = "translateX(-150%) rotate(-15deg)";
      wrapper.style.opacity = 0;
      setTimeout(() => wrapper.remove(), 300);
    });
    hammertime.on("swiperight", () => {
      saveCafe(cafeData);
      wrapper.style.transform = "translateX(150%) rotate(15deg)";
      wrapper.style.opacity = 0;
      setTimeout(() => wrapper.remove(), 300);
    });
  });
}

// Add markers to map
function addMarkers(cafes) {
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  cafes.forEach(cafe => {
    const marker = L.marker([cafe.lat, cafe.lng])
      .addTo(map)
      .bindPopup(`<b>${cafe.name}</b><br>${cafe.opening_hours}`);
    markers.push(marker);
  });
}

// Save cafe
function saveCafe(cafe) {
  let saved = JSON.parse(localStorage.getItem("savedCafes") || "[]");

  if (!saved.find(c => c.id === cafe.id)) {
    saved.push(cafe);
    localStorage.setItem("savedCafes", JSON.stringify(saved));
    alert(`${cafe.name} saved to favorites 🧋💕`);
  } else {
    alert(`${cafe.name} already saved 🫶`);
  }
}

// Show saved cafes
function showSaved() {
  const container = document.querySelector(".cards");
  container.innerHTML = "";

  const saved = JSON.parse(localStorage.getItem("savedCafes") || "[]");

  if (saved.length === 0) {
    container.innerHTML = "<p>No saved cafes yet 😢</p>";
    return;
  }

  saved.forEach(cafe => {
    const card = document.createElement("div");
    card.className = "location-card";
    card.innerHTML = `
      <img src="${cafe.photo}" alt="${cafe.name}" />
      <h3>${cafe.name}</h3>
      <p>🕐 ${cafe.hours}</p>
    `;
    container.appendChild(card);
  });
}

// Initialize
getLocation();
