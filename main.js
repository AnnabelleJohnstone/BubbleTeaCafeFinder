console.log("main.js is loading!");

let map;
let markers = [];
let mapInitialized = false;
let highlightedMarker = null;

// Initialize Leaflet map
function initMap(lat, lng) {
  if (mapInitialized) {
    map.setView([lat, lng], 14);
    return;
  }
  
  map = L.map('map').setView([lat, lng], 14);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);
  
  mapInitialized = true;
  
  // Add user location marker
  L.marker([lat, lng])
    .addTo(map)
    .bindPopup('You are here! 📍')
    .openPopup();
}

// Get user location
function getLocation() {
  const cache = JSON.parse(localStorage.getItem("cachedLocation") || "{}");
  const now = Date.now();

  if (cache.timestamp && now - cache.timestamp < 10 * 60 * 1000) {
    console.log("Using cached location");
    useLocation(cache.lat, cache.lng);
  } else {
    console.log("Getting fresh location");
    
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser 😢");
      return;
    }
    
    const container = document.querySelector(".cards");
    container.innerHTML = '<div class="loading">Getting your location... 📍</div>';
    
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        console.log("Location:", lat, lng);
        localStorage.setItem('cachedLocation', JSON.stringify({ lat, lng, timestamp: now }));
        useLocation(lat, lng);
      },
      error => {
        console.error("Geolocation error:", error);
        container.innerHTML = '<div class="loading">Location access denied 😢<br>Please enable location services</div>';
      }
    );
  }
}

// Fetch bubble tea cafes using Overpass API
async function useLocation(lat, lng) {
  const container = document.querySelector(".cards");
  container.innerHTML = '<div class="loading">Finding bubble tea near you... 🧋</div>';
  
  initMap(lat, lng);
  
  const radius = 1500;
  
  // Search specifically for bubble tea / boba tea cafes
  const query = `[out:json];(
    node["amenity"="cafe"]["cuisine"="bubble_tea"](around:${radius},${lat},${lng});
    way["amenity"="cafe"]["cuisine"="bubble_tea"](around:${radius},${lat},${lng});
    node["name"~"bubble tea|boba|珍珠奶茶",i](around:${radius},${lat},${lng});
    way["name"~"bubble tea|boba|珍珠奶茶",i](around:${radius},${lat},${lng});
  );out body;`;
  
  try {
    console.log("Fetching bubble tea cafes from Overpass API...");
    
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Received data:", data);
    
    const cafes = data.elements
      .filter(cafe => cafe.tags && cafe.tags.name)
      .map(cafe => ({
        name: cafe.tags.name,
        lat: cafe.lat || (cafe.center && cafe.center.lat),
        lng: cafe.lon || (cafe.center && cafe.center.lon),
        cuisine: cafe.tags.cuisine || 'bubble_tea',
        opening_hours: cafe.tags.opening_hours || 'Hours not available',
        id: cafe.id
      }))
      .filter(cafe => cafe.lat && cafe.lng);
    
    console.log("Processed bubble tea cafes:", cafes.length);
    
    if (cafes.length > 0) {
      displayCards(cafes);
      addMarkers(cafes);
    } else {
      container.innerHTML = `
        <div class="loading">
          No bubble tea cafes found nearby 😢<br>
          <button onclick="searchAllCafes(${lat}, ${lng})" style="margin-top: 15px; background: #ff6b9d; color: white; border: none; padding: 10px 20px; border-radius: 15px; cursor: pointer;">
            Search All Cafes Instead
          </button>
        </div>
      `;
    }
  } catch (error) {
    console.error("Error fetching cafes:", error);
    container.innerHTML = '<div class="loading">Error finding bubble tea cafes 😢<br>Please try again</div>';
  }
}

// Fallback: Search all cafes
async function searchAllCafes(lat, lng) {
  const container = document.querySelector(".cards");
  container.innerHTML = '<div class="loading">Finding all cafes near you... 🔍</div>';
  
  const radius = 1500;
  const query = `[out:json];(node["amenity"="cafe"](around:${radius},${lat},${lng});way["amenity"="cafe"](around:${radius},${lat},${lng}););out body;`;
  
  try {
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    const cafes = data.elements
      .filter(cafe => cafe.tags && cafe.tags.name)
      .map(cafe => ({
        name: cafe.tags.name,
        lat: cafe.lat || (cafe.center && cafe.center.lat),
        lng: cafe.lon || (cafe.center && cafe.center.lon),
        cuisine: cafe.tags.cuisine || 'cafe',
        opening_hours: cafe.tags.opening_hours || 'Hours not available',
        id: cafe.id
      }))
      .filter(cafe => cafe.lat && cafe.lng);
    
    if (cafes.length > 0) {
      displayCards(cafes);
      addMarkers(cafes);
    } else {
      container.innerHTML = '<div class="loading">No cafes found nearby 😢</div>';
    }
  } catch (error) {
    console.error("Error fetching cafes:", error);
    container.innerHTML = '<div class="loading">Error finding cafes 😢<br>Please try again</div>';
  }
}

// Display swipeable cards
function displayCards(cafes) {
  const container = document.querySelector(".cards");
  container.innerHTML = "";

  if (cafes.length === 0) {
    container.innerHTML = '<div class="loading">No bubble tea cafes found 😢</div>';
    return;
  }

  cafes.slice(0, 10).forEach((cafe, i) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'swipe-wrapper';
    wrapper.style.zIndex = 200 - i;

    const card = document.createElement('div');
    card.className = 'location-card';

    const imgUrl = `https://source.unsplash.com/400x300/?bubble-tea,boba,${Math.random()}`;

    const cafeData = {
      name: cafe.name,
      id: cafe.id,
      photo: imgUrl,
      hours: cafe.opening_hours,
      lat: cafe.lat,
      lng: cafe.lng
    };

    card.innerHTML = `
      <img src="${imgUrl}" alt="${cafe.name}" onerror="this.src='https://via.placeholder.com/400x300?text=Bubble+Tea'" />
      <h3>${cafe.name}</h3>
      <p>🕐 ${cafe.opening_hours}</p>
      <p><small> Swipe right to save 💖</small></p>
    `;

    // Click to show location on map
    card.addEventListener('click', (e) => {
      if (wrapper.classList.contains('swiping')) return;
      showOnMap(cafe);
    });

    wrapper.appendChild(card);
    container.appendChild(wrapper);

    const hammertime = new Hammer(wrapper);
    
    hammertime.on("panstart", () => {
      wrapper.classList.add('swiping');
    });
    
    hammertime.on("panend", () => {
      setTimeout(() => wrapper.classList.remove('swiping'), 100);
    });
    
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

// Show cafe location on map with highlight
function showOnMap(cafe) {
  map.setView([cafe.lat, cafe.lng], 16);
  
  if (highlightedMarker) {
    map.removeLayer(highlightedMarker);
  }
  
  const highlightIcon = L.divIcon({
    className: 'highlight-marker',
    html: '<div style="background-color: #ff6b9d; width: 30px; height: 30px; border-radius: 50%; border: 4px solid white; box-shadow: 0 0 20px rgba(255, 107, 157, 0.8); animation: pulse 1.5s infinite;"></div>',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
  
  highlightedMarker = L.marker([cafe.lat, cafe.lng], { icon: highlightIcon })
    .addTo(map)
    .bindPopup(`
      <div style="text-align: center; padding: 10px;">
        <h3 style="margin: 0 0 10px 0; color: #ff6b9d;">🧋 ${cafe.name}</h3>
        <p style="margin: 5px 0;">${cafe.opening_hours}</p>
        <button onclick="openInMaps(${cafe.lat}, ${cafe.lng})" style="background: #ff6b9d; color: white; border: none; padding: 8px 15px; border-radius: 15px; cursor: pointer; margin-top: 10px;">
          Open in Google Maps 🗺️
        </button>
      </div>
    `)
    .openPopup();
  
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.2); opacity: 0.7; }
      100% { transform: scale(1); opacity: 1; }
    }
  `;
  if (!document.querySelector('style[data-pulse]')) {
    style.setAttribute('data-pulse', 'true');
    document.head.appendChild(style);
  }
}

// Open location in Google Maps
function openInMaps(lat, lng) {
  window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
}

// Add markers to map
function addMarkers(cafes) {
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  cafes.forEach(cafe => {
    const marker = L.marker([cafe.lat, cafe.lng])
      .addTo(map)
      .bindPopup(`<b>🧋 ${cafe.name}</b><br>${cafe.opening_hours}`);
    
    marker.on('click', () => {
      showOnMap(cafe);
    });
    
    markers.push(marker);
  });
}

// Save cafe to favorites
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



// Show saved cafes with swipe to remove
function showSaved() {
  const container = document.querySelector(".cards");
  container.innerHTML = "";

  const saved = JSON.parse(localStorage.getItem("savedCafes") || "[]");

  if (saved.length === 0) {
    container.innerHTML = '<div class="loading">No saved cafes yet 😢</div>';
    return;
  }

  saved.forEach((cafe) => {
    const wrapper = document.createElement("div");
    wrapper.className = "swipe-wrapper";
    wrapper.style.position = "relative";
    
    const card = document.createElement("div");
    card.className = "location-card saved-card";
    card.innerHTML = `
      <button onclick="removeCafe('${cafe.id}')" style="position: absolute; top: 10px; right: 10px; background: #ff4444; color: white; border: none; padding: 8px 12px; border-radius: 50%; cursor: pointer; font-size: 16px; z-index: 10; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
        ✕
      </button>
      <img src="${cafe.photo}" alt="${cafe.name}" onerror="this.src='https://via.placeholder.com/400x300?text=Bubble+Tea'" />
      <h3>${cafe.name}</h3>
      <p>🕐 ${cafe.hours}</p>
      <p><small>👆 Click to see on map | ← Swipe left to remove</small></p>
    `;
    
    card.addEventListener('click', (e) => {
      if (e.target.tagName !== 'BUTTON') {
        showOnMap(cafe);
      }
    });
    
    wrapper.appendChild(card);
    container.appendChild(wrapper);
    
    // Add swipe gesture to remove
    const hammertime = new Hammer(wrapper);
    hammertime.on("swipeleft", () => {
      wrapper.style.transform = "translateX(-150%) rotate(-15deg)";
      wrapper.style.opacity = 0;
      setTimeout(() => {
        removeCafe(cafe.id);
      }, 300);
    });
  });
}

// Remove cafe from favorites
function removeCafe(cafeId) {
  let saved = JSON.parse(localStorage.getItem("savedCafes") || "[]");
  
  const cafe = saved.find(c => c.id === cafeId);
  const cafeName = cafe ? cafe.name : "Cafe";
  
  saved = saved.filter(c => c.id !== cafeId);
  localStorage.setItem("savedCafes", JSON.stringify(saved));
  
  alert(`${cafeName} removed from favorites 💔`);
  showSaved();
}

console.log("Bubble Tea Finder ready! 🧋");
