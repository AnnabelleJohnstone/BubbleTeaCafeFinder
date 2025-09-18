// ✅ Your restricted API key (safe if properly restricted)
const apiKey = "AIzaSyAd3slDb-7yHMXQPfmVMRWtZhlBc2YZ0Kg";

let map;
let service;
let infowindow;

// ✅ Get user location
function getLocation() {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      initMap(lat, lng);
      searchNearby(lat, lng);
    },
    () => alert("Location access denied or unavailable.")
  );
}

// ✅ Initialize Google Map
function initMap(lat, lng) {
  const center = new google.maps.LatLng(lat, lng);
  infowindow = new google.maps.InfoWindow();

  map = new google.maps.Map(document.getElementById("map"), {
    center,
    zoom: 15,
  });

  // Marker for your location
  new google.maps.Marker({
    position: center,
    map,
    title: "You are here 🧋",
  });
}

// ✅ Search for nearby bubble tea cafes
function searchNearby(lat, lng) {
  const request = {
    location: new google.maps.LatLng(lat, lng),
    radius: 1500,
    keyword: "bubble tea", // more specific than just "cafe"
    type: ["cafe"],
  };

  service = new google.maps.places.PlacesService(map);
  service.nearbySearch(request, (results, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      displayCards(results);
      addMarkers(results);
    } else {
      alert("No bubble tea spots found 😭🧋");
    }
  });
}

// ✅ Show swipeable cards
function displayCards(cafes) {
  const container = document.querySelector(".cards");
  container.innerHTML = "";

  cafes.forEach((cafe, i) => {
    const wrapper = document.createElement("div");
    wrapper.className = "swipe-wrapper";
    wrapper.style.zIndex = 200 - i;

    const imgUrl = cafe.photos?.[0]?.getUrl({ maxWidth: 400 }) ||
      "https://via.placeholder.com/250x150?text=No+Image";

    const card = document.createElement("div");
    card.className = "location-card";
    card.innerHTML = `
      <img src="${imgUrl}" alt="${cafe.name}" />
      <h3>${cafe.name}</h3>
      <p>⭐️ Rating: ${cafe.rating || "N/A"}</p>
      <p><small>Swipe right to save 💖</small></p>
    `;

    wrapper.appendChild(card);
    container.appendChild(wrapper);

    // ✅ Hammer.js swipe
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

// ✅ Add markers to the map
function addMarkers(cafes) {
  cafes.forEach((cafe) => {
    const marker = new google.maps.Marker({
      position: cafe.geometry.location,
      map,
      title: cafe.name,
    });

    google.maps.event.addListener(marker, "click", () => {
      infowindow.setContent(`<strong>${cafe.name}</strong><br>⭐️ ${cafe.rating || "N/A"}`);
      infowindow.open(map, marker);
    });
  });
}

// ✅ Save cafe
function saveCafe(cafe) {
  let saved = JSON.parse(localStorage.getItem("savedCafes") || "[]");

  if (!saved.find((c) => c.place_id === cafe.place_id)) {
    saved.push(cafe);
    localStorage.setItem("savedCafes", JSON.stringify(saved));
    alert(`${cafe.name} saved!`);
  } else {
    alert(`${cafe.name} is already saved.`);
  }
}

// ✅ Show saved cafes
function showSaved() {
  const container = document.querySelector(".cards");
  container.innerHTML = "";

  const saved = JSON.parse(localStorage.getItem("savedCafes") || "[]");

  if (saved.length === 0) {
    container.innerHTML = "<p>No saved cafes yet 😢</p>";
    return;
  }

  saved.forEach((cafe) => {
    const card = document.createElement("div");
    card.className = "location-card";
    card.innerHTML = `
      <img src="${cafe.photo}" alt="${cafe.name}" />
      <h3>${cafe.name}</h3>
      <p>⭐️ Rating: ${cafe.rating}</p>
    `;
    container.appendChild(card);
  });
}
