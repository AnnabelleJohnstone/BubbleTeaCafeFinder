async function useLocation(lat, lng) {
  const container = document.querySelector(".cards");
  container.innerHTML = '<div class="loading">Finding cafes near you... 🔍</div>';
  
  initMap(lat, lng);
  
  const radius = 1500;
  
  // Properly formatted Overpass query
  const query = `[out:json];(node["amenity"="cafe"](around:${radius},${lat},${lng});way["amenity"="cafe"](around:${radius},${lat},${lng}););out body;`;
  
  try {
    console.log("Fetching cafes from Overpass API...");
    
    // Use URLSearchParams to properly encode the query
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'data=' + encodeURIComponent(query)
    });
    
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
        cuisine: cafe.tags.cuisine || 'cafe',
        opening_hours: cafe.tags.opening_hours || 'Hours not available',
        id: cafe.id
      }))
      .filter(cafe => cafe.lat && cafe.lng);
    
    console.log("Processed cafes:", cafes.length);
    
    if (cafes.length > 0) {
      displayCards(cafes);
      addMarkers(cafes);
    } else {
      container.innerHTML = '<div class="loading">No cafes found nearby 😢<br>Try a different location</div>';
    }
  } catch (error) {
    console.error("Error fetching cafes:", error);
    container.innerHTML = '<div class="loading">Error finding cafes 😢<br>Please try again</div>';
  }
}
