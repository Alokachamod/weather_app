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

