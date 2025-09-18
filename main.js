const apiKey = "AIzaSyAd3slDb-7yHMXQPfmVMRWtZhlBc2YZ0Kg"; // restricted key
const useProxy = true;
const proxy = "https://cors-anywhere.herokuapp.com/";

let map;
let markers = [];

// Initialize Google Map
function initMap(lat, lng) {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat, lng },
    zoom: 14,
  });
}

// Get user location (with 10 min cache)
function getLocation() {
  const cache = JSON.parse(localStorage.getItem("cachedLocation") || "{}");
  const now = Date.now();

  if (cache.timestamp && now - cache.timestamp < 10 * 60 * 1000) {
    initMap(cache.lat, cache.lng);
    useLocation(cache.lat, cache.lng);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      localStorage.setItem("cachedLocation", JSON.stringify({ lat, lng, timestamp: now }));
      initMap(lat, lng);
      useLocation(lat, lng);
    },
    () => alert("Location access denied 🥲🧋")
  );
}

// Fetch cafes (bubble tea / cafe spots)
async function useLocation(lat, lng) {
  const endpoint = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=2000&type=cafe&keyword=bubble+tea&key=${apiKey}`;
  const url = useProxy ? proxy + endpoint : endpoint;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.results) {
      displayCards(data.results);
      addMarkers(data.results);
    } else {
      alert("No bubble tea spots found 😭🧋");
    }
  } catch (e) {
    console.error("Error fetching Places API:", e);
    alert("Error fetching cafes 🫠");
  }
}

// Display swipeable cards
function displayCards(cafes) {
  const container = document.querySelector(".cards");
  container.innerHTML = "";

  cafes.forEach((cafe, i) => {
    const wrapper = document.createElement("div");
    wrapper.className = "swipe-wrapper";
    wrapper.style.zIndex = 200 - i;

    const imgUrl = cafe.photos?.[0]?.photo_reference
      ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${cafe.photos[0].photo_reference}&key=${apiKey}`
      : "https://via.placeholder.com/250x150?text=No+Image";

    const card = document.createElement("div");
    card.className = "location-card";
    card.innerHTML = `
      <img src="${imgUrl}" alt="${cafe.name}" />
      <h3>${cafe.name}</h3>
      <p>🧋 Rating: ${cafe.rating || "N/A"}</p>
      <p><small>Swipe right to save 🍡</small></p>
    `;

    wrapper.appendChild(card);
    container.appendChild(wrapper);

    const hammertime = new Hammer(wrapper);
    hammertime.on("swipeleft", () => {
      wrapper.style.transform = "translateX(-150%) rotate(-15deg)";
      wrapper.style.opacity = 0;
      setTimeout(() => wrapper.remove(), 100);
    });

    hammertime.on("swiperight", () => {
      saveCafe({
        name: cafe.name,
        place_id: cafe.place_id,
        photo: imgUrl,
        rating: cafe.rating || "N/A",
      });
      wrapper.style.transform = "translateX(150%) rotate(15deg)";
      wrapper.style.opacity = 0;
      setTimeout(() => wrapper.remove(), 100);
    });
  });
}

// Add markers on the map
function addMarkers(cafes) {
  markers.forEach(m => m.setMap(null));
  markers = [];

  cafes.forEach(cafe => {
    if (!cafe.geometry) return;
    const marker = new google.maps.Marker({
      position: cafe.geometry.location,
      map: map,
      title: cafe.name,
    });
    markers.push(marker);
  });
}

// Save cafes locally
function saveCafe(cafe) {
  const saved = JSON.parse(localStorage.getItem("savedCafes") || "[]");

  if (!saved.find(c => c.place_id === cafe.place_id)) {
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
      <p>🧋 Rating: ${cafe.rating}</p>
    `;
    container.appendChild(card);
  });
}
