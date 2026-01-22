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
      // If no specific bubble tea places found, show message with option to search all cafes
      container.innerHTML = `
        <div class="loading">
          No bubble tea cafes found nearby 😢<br>
          <button onclick="searchAllCafes(${lat}, ${lng})" style="margin-top: 15px;">
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

// Optional fallback function to search all cafes if no bubble tea places found
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
