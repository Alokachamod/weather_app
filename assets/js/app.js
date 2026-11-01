const mapElement = document.querySelector("#map");
const mapStatus = document.querySelector("#map-status");
const initialLocation = { lat: 6.4211, lng: 79.9989 };
const mapId = "DEMO_MAP_ID";
let map;
let mapMarker;
let currentMapLocation = initialLocation;

function initMap() {
    map = new google.maps.Map(mapElement, {
        mapId,
        center: currentMapLocation,
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
    });
    mapMarker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: currentMapLocation,
        title: "Weather location",
    });

    if (mapStatus) {
        mapStatus.textContent = "";
    }
}

function setMapLocation(coords) {
    currentMapLocation = { lat: coords.lat, lng: coords.lon };

    if (map) {
        map.setCenter(currentMapLocation);
        mapMarker.position = currentMapLocation;
    }

    if (mapElement) {
        mapElement.setAttribute("aria-label", `Map showing location at ${coords.lat}, ${coords.lon}`);
    }
}

function getWeatherIconPath(condition, isDay) {
    const description = condition.toLowerCase();
    let icon;

    if (description.includes("thunder") && /rain|shower/.test(description)) {
        icon = "Rain and Storm.png";
    } else if (description.includes("thunder")) {
        icon = "thunderstrom.png";
    } else if (/snow|sleet|blizzard|ice pellets/.test(description)) {
        icon = "Snow.png";
    } else if (/rain|drizzle|shower/.test(description)) {
        icon = "Rain.png";
    } else if (/fog|mist|haze/.test(description)) {
        icon = "fog.png";
    } else if (description.includes("wind")) {
        icon = "wind.png";
    } else if (description.includes("partly cloudy")) {
        icon = "partly cloudy.png";
    } else if (/cloud|overcast/.test(description)) {
        icon = isDay ? "cloudy.png" : "cloudly night.png";
    } else if (/clear|sunny/.test(description)) {
        icon = isDay ? "clear day.png" : "clear night.png";
    } else {
        icon = isDay ? "cloudy.png" : "cloudly night.png";
    }

    return `assets/imgs/weather_type_icon/${encodeURIComponent(icon)}`;
}

function formatForecastTime(time) {
    const [, hours, minutes] = time.match(/\d{4}-\d{2}-\d{2} (\d{2}):(\d{2})/) || [];
    if (hours === undefined) {
        return time;
    }

    const hour = Number(hours);
    return `${hour % 12 || 12}:${minutes} ${hour >= 12 ? "PM" : "AM"}`;
}

function renderHourlyForecast(current, forecastDays) {
    if (!forecastTrack) {
        return;
    }

    const upcomingHours = forecastDays
        .flatMap(day => day.hour)
        .filter(hour => hour.time_epoch > current.last_updated_epoch)
        .slice(0, Math.max(forecastTrack.children.length - 1, 0));
    const items = [
        {
            time: "Now",
            temp: current.temp_c,
            condition: current.condition,
            isDay: current.is_day
        },
        ...upcomingHours.map(hour => ({
            time: formatForecastTime(hour.time),
            temp: hour.temp_c,
            condition: hour.condition,
            isDay: hour.is_day
        }))
    ];

    forecastTrack.querySelectorAll(".forecast-card").forEach((card, index) => {
        const item = items[index];
        if (!item) {
            card.hidden = true;
            return;
        }

        card.hidden = false;
        card.classList.toggle("active", index === 0);
        card.querySelector(".f-time").textContent = item.time;

        const icon = card.querySelector(".f-icon");
        icon.src = getWeatherIconPath(item.condition.text, item.isDay === 1);
        icon.alt = item.condition.text;

        card.querySelector(".f-temp").textContent = `${Math.round(item.temp)}°`;
        card.querySelector(".f-desc").textContent = item.condition.text;
    });
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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(window.GOOGLE_MAPS_API_KEY)}&callback=initMap&loading=async&libraries=marker`;
    script.async = true;
    script.onerror = () => {
        mapStatus.textContent = "Google Maps failed to load. Check your connection and API settings.";
    };
    document.head.appendChild(script);
}

loadGoogleMaps();

const forecastTrack = document.querySelector("#forecast-track");
const prevBtn = document.querySelector("#forecast-prev-btn");
const nextBtn = document.querySelector("#forecast-next-btn");
const searchInput = document.querySelector("#map-search-input");
const searchButton = document.querySelector("#map-search-button");

if (forecastTrack && prevBtn && nextBtn) {
    prevBtn.addEventListener("click", () => {
        forecastTrack.scrollBy({ left: -240, behavior: "smooth" });
    });
    nextBtn.addEventListener("click", () => {
        forecastTrack.scrollBy({ left: 240, behavior: "smooth" });
    });
}

async function searchLocation() {
    const location = searchInput.value.trim();

    if (location === "") {
        mapStatus.textContent = "Enter a city or location to search.";
        return;
    }

    searchButton.disabled = true;
    mapStatus.textContent = "Searching...";

    try {
        const data = await getWeatherData(location);
        showWeather(data);
        mapStatus.textContent = `Showing weather for ${data.location.name}.`;
    } catch (error) {
        mapStatus.textContent = error.message;
    } finally {
        searchButton.disabled = false;
    }
}

if (searchInput && searchButton) {
    searchButton.addEventListener("click", searchLocation);
    searchInput.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            searchLocation();
        }
    });
}

const weekdayPills = document.querySelectorAll(".weekday-pill");
weekdayPills.forEach(pill => {
    pill.addEventListener("click", () => {
        weekdayPills.forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
    });
});

const currentDateEl = document.querySelector("#current-date");
const currentTimeEl = document.querySelector("#current-time");
const backgroundElement = document.querySelector("#bg-img");
let backgroundCondition = "";
let backgroundWindKph = 0;
let backgroundTimeZone;

function getTimeBackgroundVariable(hour) {
    if (hour >= 6 && hour < 8) return "--bg-6am";
    if (hour >= 8 && hour < 10) return "--bg-8am";
    if (hour >= 10 && hour < 12) return "--bg-10am";
    if (hour >= 12 && hour < 14) return "--bg-12pm";
    if (hour >= 14 && hour < 16) return "--bg-2pm";
    if (hour >= 16 && hour < 18) return "--bg-4pm";
    if (hour >= 18 && hour < 20) return "--bg-6pm";
    if (hour >= 20 && hour < 22) return "--bg-8pm";
    return "--bg-10pm";
}

function getBackgroundVariable(condition, windKph, hour) {
    const description = condition.toLowerCase();

    if (description.includes("thunder") && /rain|shower/.test(description)) {
      return "--bg-rainy-thunderstorm";
    }
    if (description.includes("thunder")) {
      return "--bg-thunderstorm";
    }
    if (/snow|sleet|blizzard|ice pellets/.test(description)) {
      return "--bg-snow";
    }
    if (/rain|drizzle|shower/.test(description)) {
      return "--bg-rainy";
    }
    if (description.includes("wind") || windKph >= 30) {
      return "--bg-windy";
    }
    if (/cloud|overcast|fog|mist|haze/.test(description)) {
      return "--bg-cloudy";
    }

    return getTimeBackgroundVariable(hour);
}

function updateBackground() {
    if (!backgroundElement) {
      return;
    }

    const timeOptions = {
      hour: "2-digit",
      hourCycle: "h23",
      ...(backgroundTimeZone ? { timeZone: backgroundTimeZone } : {})
    };
    const hour = Number(new Intl.DateTimeFormat("en-US", timeOptions)
      .formatToParts(new Date())
      .find(part => part.type === "hour").value);
    const variable = getBackgroundVariable(backgroundCondition, backgroundWindKph, hour);

    backgroundElement.style.backgroundImage = `var(${variable})`;
}

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
      pos => resolve({
        lat: pos.coords.latitude,
        lon: pos.coords.longitude
      }),
      reject,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

const weatherApiKey = "d9cd4ed3ab814b87b7b105728261210";

async function getWeatherData(location) {
  const res = await fetch(
    `https://api.weatherapi.com/v1/forecast.json?key=${weatherApiKey}&q=${encodeURIComponent(location)}&days=2`
  );
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error?.message || `Weather request failed (${res.status})`);
  }

  return data;
}

function showWeather(data) {
  const current = data.current;

  backgroundCondition = current.condition.text;
  backgroundWindKph = current.wind_kph;
  backgroundTimeZone = data.location.tz_id;
  updateBackground();

  setMapLocation(data.location);
  document.querySelector("#current-temp").textContent = Math.round(current.temp_c);
  document.querySelector("#feels-like").textContent = `Feels like ${Math.round(current.feelslike_c)}°`;
  document.querySelector("#weather-condition").textContent = current.condition.text;

  const weatherIcon = document.querySelector("#weather-icon");
  weatherIcon.src = getWeatherIconPath(current.condition.text, current.is_day === 1);
  weatherIcon.alt = current.condition.text;

  document.querySelector("#humidity-value").textContent = `${current.humidity}%`;
  document.querySelector("#wind-value").textContent = `${Math.round(current.wind_kph)} km/h`;
  document.querySelector("#location-city").textContent = data.location.name;
  document.querySelector("#location-country").textContent = data.location.country;
  renderHourlyForecast(current, data.forecast.forecastday);
}

async function loadWeather() {
  let coords;

  if ("geolocation" in navigator) {
    try {
      coords = await getLocation();
    } catch (error) {
      console.warn("Could not get your location; using the default location.", error);
      coords = { lat: 6.9271, lon: 79.8612 };
    }
  } else {
    console.warn("Geolocation is not supported; using the default location.");
    coords = { lat: 6.9271, lon: 79.8612 };
  }

  const data = await getWeatherData(`${coords.lat},${coords.lon}`);
  showWeather(data);
}



loadWeather().catch(error => {
  console.error("Could not load weather data:", error);
});
updateLiveDateTime();
setInterval(updateLiveDateTime, 1000);
updateBackground();
setInterval(updateBackground, 60 * 1000);
