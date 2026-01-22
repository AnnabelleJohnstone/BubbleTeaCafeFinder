
# 🧋 Bubble Tea Finder

A playful **swipe-to-save app** for finding nearby cafes (with a bubble tea theme 🍡✨).  
Built using the **Google Maps JavaScript API**, **Places API**, and **Hammer.js** for swipe gestures.  
The app displays swipeable cards with nearby cafes and shows their location on an interactive map.  

---

##  Features

-  Detects your current location (with geolocation API).  
-  Displays nearby cafes in a stack of swipeable cards.  
-  Swipe right to save a cafe, swipe left to dismiss.  
-  Interactive Google Map showing cafe markers side-by-side with the cards.  
-  Saved cafes stored locally in your browser (via `localStorage`).  

---

##  How It Works

- **Cards Section**  
  Each card shows the cafe name, photo, rating 🧋, and a cute swipe instruction 🍡.  

- **Map Section**  
  A Google Map displays markers for all the cafes currently loaded.  

- **Swiping**  
  - Swipe **right** → Save cafe to favorites 💖🧋.  
  - Swipe **left** → Skip cafe.  

---

##  Tech Stack

- **HTML / CSS / JavaScript** — Core app.  
- **Google Maps JavaScript API** — Displays map and markers.  
- **Google Places API** — Fetches nearby cafes.  
- **Hammer.js** — Handles swipe gestures.  
- **LocalStorage** — Saves user’s favorite cafes locally.  

---

##  Getting Started

1. Clone this repository:

   ```bash
   git clone https://github.com/YOUR_USERNAME/bubble-tea-finder.git
   cd bubble-tea-finder
