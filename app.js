const apiKey = '578c7c27c3584b7aaa2143526252106'; // Your WeatherAPI key
const apiUrl = 'https://api.weatherapi.com/v1';

// DOM Elements
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const errorMessage = document.getElementById('error-message');
const currentWeatherSection = document.getElementById('current-weather');
const forecastSection = document.getElementById('forecast');
const forecastCardsContainer = document.getElementById('forecast-cards');
const loader = document.getElementById('loader');
const themeToggleBtn = document.getElementById('theme-toggle');

const locationNameEl = document.getElementById('location-name');
const localTimeEl = document.getElementById('local-time');
const weatherIconEl = document.getElementById('weather-icon');
const temperatureEl = document.getElementById('temperature');
const conditionEl = document.getElementById('condition');
const feelsLikeEl = document.getElementById('feels-like');
const windSpeedEl = document.getElementById('wind-speed');
const humidityEl = document.getElementById('humidity');
const pressureEl = document.getElementById('pressure');
const uvIndexEl = document.getElementById('uv-index');
const sunriseEl = document.getElementById('sunrise');
const sunsetEl = document.getElementById('sunset');

// Toggle dark/light theme
themeToggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  themeToggleBtn.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
});

// Show loader
function showLoader() {
  loader.classList.remove('hidden');
}

// Hide loader
function hideLoader() {
  loader.classList.add('hidden');
}

// Clear weather display
function clearWeather() {
  currentWeatherSection.classList.add('hidden');
  forecastSection.classList.add('hidden');
  errorMessage.classList.add('hidden');
  errorMessage.textContent = '';
  forecastCardsContainer.innerHTML = '';
}

// Display error message
function displayError(message) {
  clearWeather();
  errorMessage.textContent = message;
  errorMessage.classList.remove('hidden');
}

// Format time string from API (e.g., "2023-07-07 18:32")
function formatTime(dateTimeStr) {
  const dateObj = new Date(dateTimeStr);
  return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Format day name from API date (e.g., "Fri")
function getDayName(dateStr) {
  const dateObj = new Date(dateStr);
  return dateObj.toLocaleDateString(undefined, { weekday: 'short' });
}

// Fetch weather data (current + forecast)
async function fetchWeather(city) {
  clearWeather();
  showLoader();

  try {
    // Fetch current weather
    const currentResponse = await fetch(
      `${apiUrl}/current.json?key=${apiKey}&q=${encodeURIComponent(city)}&aqi=no`
    );
    const currentData = await currentResponse.json();

    if (currentData.error) {
      throw new Error(currentData.error.message || 'City not found');
    }

    // Fetch forecast (5 days)
    const forecastResponse = await fetch(
      `${apiUrl}/forecast.json?key=${apiKey}&q=${encodeURIComponent(city)}&days=5&aqi=no&alerts=no`
    );
    const forecastData = await forecastResponse.json();

    if (forecastData.error) {
      throw new Error(forecastData.error.message || 'Forecast not available');
    }

    displayWeather(currentData, forecastData);
  } catch (error) {
    displayError(error.message);
  } finally {
    hideLoader();
  }
}

// Display weather info in UI
function displayWeather(currentData, forecastData) {
  const loc = currentData.location;
  const cur = currentData.current;

  // Current weather section
  locationNameEl.textContent = `${loc.name}, ${loc.country}`;
  localTimeEl.textContent = loc.localtime.split(' ')[1];
  weatherIconEl.src = `https:${cur.condition.icon}`;
  weatherIconEl.alt = cur.condition.text;
  temperatureEl.textContent = `${Math.round(cur.temp_c)}°C`;
  conditionEl.textContent = cur.condition.text;
  feelsLikeEl.textContent = `${Math.round(cur.feelslike_c)}°C`;
  windSpeedEl.textContent = `${cur.wind_kph.toFixed(1)} km/h`;
  humidityEl.textContent = `${cur.humidity}%`;
  pressureEl.textContent = `${cur.pressure_mb} hPa`;
  uvIndexEl.textContent = cur.uv.toFixed(1);
  sunriseEl.textContent = forecastData.forecast.forecastday[0].astro.sunrise;
  sunsetEl.textContent = forecastData.forecast.forecastday[0].astro.sunset;

  currentWeatherSection.classList.remove('hidden');

  // Forecast cards
  forecastCardsContainer.innerHTML = '';
  forecastData.forecast.forecastday.forEach(day => {
    const dayName = getDayName(day.date);
    const iconUrl = `https:${day.day.condition.icon}`;
    const maxTemp = Math.round(day.day.maxtemp_c);
    const minTemp = Math.round(day.day.mintemp_c);
    const conditionText = day.day.condition.text;

    const card = document.createElement('div');
    card.classList.add('forecast-card');

    card.innerHTML = `
      <h4>${dayName}</h4>
      <img src="${iconUrl}" alt="${conditionText}" />
      <p class="temp">${maxTemp}° / ${minTemp}°</p>
      <p class="condition">${conditionText}</p>
    `;

    forecastCardsContainer.appendChild(card);
  });

  forecastSection.classList.remove('hidden');
}

// Search button click
searchBtn.addEventListener('click', () => {
  const city = cityInput.value.trim();
  if (city) {
    fetchWeather(city);
  } else {
    displayError('Please enter a city name.');
  }
});

// Support Enter key on input
cityInput.addEventListener('keypress', e => {
  if (e.key === 'Enter') {
    searchBtn.click();
  }
});

// Load default weather immediately, show UI, then try geolocation
window.addEventListener('load', () => {
  // Show default city weather (NY) first
  fetchWeather('New York');

  // Then request geolocation, but don't block UI
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        fetchWeather(`${latitude},${longitude}`);
      },
      () => {
        // User denied or error: do nothing, default weather remains visible
      }
    );
  }
});
