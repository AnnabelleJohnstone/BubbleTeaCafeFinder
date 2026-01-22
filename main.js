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
      <p><small>👆 Click to see on map | Swipe right to save 💖</small></p>
    `;

    // Click to show location on map
    card.addEventListener('click', (e) => {
      // Prevent click when swiping
      if (wrapper.classList.contains('swiping')) return;
      
      showOnMap(cafe);
    });

    wrapper.appendChild(card);
    container.appendChild(wrapper);

    const hammertime = new Hammer(wrapper);
    
    // Track if user is swiping
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
let highlightedMarker = null;

function showOnMap(cafe) {
  // Center map on the cafe
  map.setView([cafe.lat, cafe.lng], 16);
  
  // Remove previous highlight if exists
  if (highlightedMarker) {
    map.removeLayer(highlightedMarker);
  }
  
  // Create a highlighted marker with custom icon
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
  
  // Add pulsing animation
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

// Optional: Open location in Google Maps
function openInMaps(lat, lng) {
  window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
}
function addMarkers(cafes) {
  // Clear old markers
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  // Add new markers
  cafes.forEach(cafe => {
    const marker = L.marker([cafe.lat, cafe.lng])
      .addTo(map)
      .bindPopup(`<b>🧋 ${cafe.name}</b><br>${cafe.opening_hours}`);
    
    // Click marker to highlight
    marker.on('click', () => {
      showOnMap(cafe);
    });
    
    markers.push(marker);
  });
}
