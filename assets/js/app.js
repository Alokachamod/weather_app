const mapElement = document.querySelector("#map");
const mapStatus = document.querySelector("#map-status");
const initialLocation = { lat: 6.4211, lng: 79.9989 };

function initMap() {
    new google.maps.Map(mapElement, {
        center: initialLocation,
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
    });

    mapStatus.textContent = "";
}

function loadGoogleMaps() {
    if (!window.GOOGLE_MAPS_API_KEY) {
        mapStatus.textContent = "Map key is missing. Generate the local map config from .env.";
        return;
    }

    window.initMap = initMap;
    window.gm_authFailure = () => {
        mapStatus.textContent = "Google Maps could not authenticate this key. Check its API and website restrictions.";
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(window.GOOGLE_MAPS_API_KEY)}&callback=initMap&loading=async`;
    script.async = true;
    script.onerror = () => {
        mapStatus.textContent = "Google Maps failed to load. Check your connection and API settings.";
    };
    document.head.appendChild(script);
}

loadGoogleMaps();

// --- UI Interaction Handlers ---
const forecastTrack = document.querySelector("#forecast-track");
const prevBtn = document.querySelector("#forecast-prev-btn");
const nextBtn = document.querySelector("#forecast-next-btn");

if (forecastTrack && prevBtn && nextBtn) {
    prevBtn.addEventListener("click", () => {
        forecastTrack.scrollBy({ left: -240, behavior: "smooth" });
    });
    nextBtn.addEventListener("click", () => {
        forecastTrack.scrollBy({ left: 240, behavior: "smooth" });
    });
}

// Weekday pills interactive active state
const weekdayPills = document.querySelectorAll(".weekday-pill");
weekdayPills.forEach(pill => {
    pill.addEventListener("click", () => {
        weekdayPills.forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
    });
});

const currentDateEl = document.querySelector("#current-date");
const currentTimeEl = document.querySelector("#current-time");

function updateLiveDateTime() {
    const now = new Date();

    if (currentDateEl) {
        const weekday = now.toLocaleDateString("en-US", { weekday: "long" });
        const day = now.getDate();
        const month = now.toLocaleDateString("en-US", { month: "long" });
        const year = now.getFullYear();

        currentDateEl.textContent = `${weekday}, ${day} ${month} ${year}`;
    }

    if (currentTimeEl) {
        const timeParts = now.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true
        }).split(" ");
        const timeValue = timeParts[0];
        const period = timeParts[1] || "AM";

        currentTimeEl.innerHTML = `${timeValue} <span class="time-meridiem">${period}</span>`;
    }
}

function getLocation() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      err => reject(err)
    );
  });
}

async function loadWeather() {
  let coords;

  try {
    coords = await getLocation();
  } catch {
    coords = { lat: 6.9271, lon: 79.8612 }; // permission nathnam default (Colombo)
  }

  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid= &units=metric`
  );
  const data = await res.json();

  console.log(data); 
  
}




updateLiveDateTime();
setInterval(updateLiveDateTime, 1000);


function setCurrentLocationWeather(){

}

