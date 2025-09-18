
// script.js

// Get API key from config.js (never push config.js to GitHub!)
const apiKey = CONFIG.GOOGLE_MAPS_API_KEY;
const useProxy = true;
const proxy = "https://cors-anywhere.herokuapp.com/";

let map;
let markers = [];

// ✅ Get location (with 10 min cache)
function getLocation() {
  const cache = JSON.parse(localStorage.getItem("cachedLocation") || "{}");
  const now = Date.now();

  if (cache.timestamp && now - cache.timestamp < 10 * 60 * 1000) {
    useLocation(cache.lat, cache.lng);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      localStorage.setItem(
        "cachedLocation",
        JSON.stringify({ lat, lng, timestamp: now })
      );

      useLocation(lat, lng);
    },
    () => alert("Location access denied or unavailable 🥲🧋")
  );
}

// ✅ Fetch cafes from Google Places
async function useLocation(lat, lng) {
  const endpoint = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=1500&type=cafe&key=${apiKey}`;
  const url = useProxy ? proxy + endpoint : endpoint;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.results) {
      displayCards(data.results);
    } else {
      alert("No cafes found 😭🧋");
    }
  } catch (e) {
    console.error("Error fetching Places API:", e);
    alert("Error fetching cafes 🫠");
  }
}

// ✅ Display swipeable cards
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

    // ✅ Swipe actions with Hammer.js
    const hammertime = new Hammer(wrapper);
    hammertime.on("swipeleft", () => {
      wrapper.style.transform = "translateX(-150%) rotate(-15deg)";
      wrapper.style.opacity = 0;
      setTimeout(() => wrapper.remove(), 100);
    });

    hammertime.on("swiperight", () => {
      saveCafe(cafe);
      wrapper.style.transform = "translateX(150%) rotate(15deg)";
      wrapper.style.opacity = 0;
      setTimeout(() => wrapper.remove(), 100);
    });
  });
}

// ✅ Save cafe to localStorage
function saveCafe(cafe) {
  const saved = JSON.parse(localStorage.getItem("savedCafes") || "[]");

  if (!saved.find((c) => c.place_id === cafe.place_id)) {
    saved.push(cafe);
    localStorage.setItem("savedCafes", JSON.stringify(saved));
    alert(`${cafe.name} saved! 🧋💕`);
  } else {
    alert(`${cafe.name} is already saved 🫶`);
  }
}

// ✅ Show saved cafes
function showSaved() {
  const container = document.querySelector(".cards");
  container.innerHTML = "";

  const saved = JSON.parse(localStorage.getItem("savedCafes") || "[]");
  if (saved.length === 0) {
    container.innerHTML = "<p>No saved cafes yet 😢🧋</p>";
    return;
  }

  saved.forEach((cafe) => {
    const card = document.createElement("div");
    card.className = "location-card";
    const imgUrl = cafe.photos?.[0]?.photo_reference
      ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${cafe.photos[0].photo_reference}&key=${apiKey}`
      : "https://via.placeholder.com/250x150?text=No+Image";

    card.innerHTML = `
      <img src="${imgUrl}" alt="${cafe.name}" />
      <h3>${cafe.name}</h3>
      <p>🧋 Rating: ${cafe.rating || "N/A"}</p>
    `;
    container.appendChild(card);
  });
}
