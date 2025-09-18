<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Bubble Tea Finder 🧋</title>
  <style>
    body {
      display: flex;
      font-family: Arial, sans-serif;
      background: #fff0f6;
      margin: 0;
      padding: 0;
    }
    .cards {
      flex: 1;
      padding: 1em;
    }
    #map {
      flex: 1;
      height: 100vh;
    }
    .location-card {
      background: #fff;
      border-radius: 12px;
      padding: 1em;
      margin-bottom: 1em;
      box-shadow: 0 2px 6px rgba(0,0,0,0.1);
      text-align: center;
    }
    .location-card img {
      max-width: 100%;
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <div class="cards"></div>
  <div id="map"></div>

  <script src="https://cdn.jsdelivr.net/npm/hammerjs@2.0.8/hammer.min.js"></script>
 <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyAd3slDb-7yHMXQPfmVMRWtZhlBc2YZ0Kg&libraries=places"></script>
  <script>
  const apiKey = "AIzaSyAd3slDb-7yHMXQPfmVMRWtZhlBc2YZ0Kg"; // replace with your key
  const useProxy = true;
  const proxy = "https://cors-anywhere.herokuapp.com/";
  let map;
  let markers = [];

  // ✅ Initialize Google Map
  function initMap(lat, lng) {
    map = new google.maps.Map(document.getElementById("map"), {
      center: { lat, lng },
      zoom: 14,
    });
  }

  // ✅ Get location
  function getLocation() {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        initMap(lat, lng);
        useLocation(lat, lng);
      },
      () => alert("Location access denied 🥲🧋")
    );
  }

  // ✅ Fetch cafes
  async function useLocation(lat, lng) {
    const endpoint = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=1500&type=cafe&key=${apiKey}`;
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

  // ✅ Show swipeable cards
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
        saveCafe(cafe);
        wrapper.style.transform = "translateX(150%) rotate(15deg)";
        wrapper.style.opacity = 0;
        setTimeout(() => wrapper.remove(), 100);
      });
    });
  }

  // ✅ Add markers on the map
  function addMarkers(cafes) {
    markers.forEach(m => m.setMap(null)); // clear old markers
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

  // ✅ Save cafes
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

  getLocation();
  </script>
</body>
</html>
