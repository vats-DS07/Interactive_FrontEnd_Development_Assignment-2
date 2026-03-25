
const API_KEY   = "ba079b687b1088d073302d089e8ebddd";
const BASE_URL  = "https://api.openweathermap.org/data/2.5/weather";

var cityInput       = document.getElementById("cityInput");
var searchBtn       = document.getElementById("searchBtn");
var weatherBox      = document.getElementById("weatherBox");
var historyBox      = document.getElementById("historyBox");
var consoleBox      = document.getElementById("consoleBox");
var clearHistBtn    = document.getElementById("clearHistBtn");
var clearConsoleBtn = document.getElementById("clearConsoleBtn");

function cLog(type, message) {
  var div = document.createElement("div");
  div.className = "log " + type;
  div.innerHTML = '<span class="badge">' + type.toUpperCase() + '</span> ' + message;
  consoleBox.appendChild(div);
  consoleBox.scrollTop = consoleBox.scrollHeight;
}

function getEmoji(main) {
  var map = { Clear:"☀️", Clouds:"☁️", Rain:"🌧️", Drizzle:"🌦️",
    Thunderstorm:"⛈️", Snow:"❄️", Mist:"🌫️", Fog:"🌫️", Haze:"🌁" };
  return map[main] || "🌡️";
}

function degToCompass(deg) {
  if (deg == null) return "";
  return ["N","NE","E","SE","S","SW","W","NW"][Math.round(deg / 45) % 8];
}

async function getWeather(city) {
  cLog("async", 'fetch() called for <span class="hl">"' + city + '"</span> — pushed to Web API.');

  var url = BASE_URL + "?q=" + encodeURIComponent(city) + "&appid=" + API_KEY + "&units=metric";
  var response = await fetch(url);

  cLog("promise", '.then() resolved — HTTP <span class="hl">' + response.status + "</span>");

  if (!response.ok) throw new Error("City not found. Check the spelling and try again.");

  var data = await response.json();
  cLog("promise", "res.json() resolved — JSON parsed successfully ✓");
  return data;
}

function renderWeather(d) {
  var emoji     = getEmoji(d.weather[0].main);
  var compass   = degToCompass(d.wind.deg);
  var temp      = Math.round(d.main.temp);
  var feelsLike = Math.round(d.main.feels_like);
  var humidity  = d.main.humidity;
  var now       = new Date();
  var dateStr   = now.toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" });
  var timeStr   = now.toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit" });

  weatherBox.innerHTML =
    '<div class="weather-banner">' +
      '<span class="banner-emoji">' + emoji + '</span>' +
      '<div class="banner-info">' +
        '<div class="banner-temp">' + temp + '°C</div>' +
        '<div class="banner-condition">' + d.weather[0].description + '</div>' +
        '<div class="banner-location">' + d.name + ', ' + d.sys.country + '</div>' +
        '<div class="banner-time">' + dateStr + '  •  ' + timeStr + '</div>' +
      '</div>' +
    '</div>' +

    '<div class="weather-item"><label>📍 City</label><span>' + d.name + ', ' + d.sys.country + '</span></div>' +
    '<div class="weather-item"><label>🌡️ Temperature</label><span>' + temp + ' °C</span></div>' +
    '<div class="weather-item"><label>🤒 Feels Like</label><span>' + feelsLike + ' °C</span></div>' +
    '<div class="weather-item"><label>🌤️ Weather</label><span>' + d.weather[0].main + '</span></div>' +
    '<div class="weather-item"><label>💧 Humidity</label>' +
      '<span class="humidity-wrap">' + humidity + '% ' +
        '<span class="humidity-bar"><span class="humidity-fill" style="width:' + humidity + '%"></span></span>' +
      '</span></div>' +
    '<div class="weather-item"><label>💨 Wind Speed</label><span>' + d.wind.speed + ' m/s ' + compass + '</span></div>' +
    '<div class="weather-item"><label>👁️ Visibility</label><span>' + (d.visibility ? (d.visibility/1000).toFixed(1) + " km" : "N/A") + '</span></div>' +
    '<div class="weather-item"><label>📅 Local Time</label><span>' + dateStr + ' • ' + timeStr + '</span></div>';

  cLog("sync", "DOM updated — weather rendered for <span class='hl'>" + d.name + "</span>.");
}

function saveHistory(city) {
  var history = JSON.parse(localStorage.getItem("weatherHistory")) || [];
  history = history.filter(function(c) { return c.toLowerCase() !== city.toLowerCase(); });
  history.unshift(city);
  if (history.length > 8) history = history.slice(0, 8);
  localStorage.setItem("weatherHistory", JSON.stringify(history));
  cLog("info", 'Saved <span class="hl">"' + city + '"</span> to localStorage.');
  showHistory();
}

function showHistory() {
  var history = JSON.parse(localStorage.getItem("weatherHistory")) || [];
  historyBox.innerHTML = "";
  if (history.length === 0) {
    historyBox.innerHTML = '<span class="no-history">No searches yet.</span>';
    return;
  }
  history.forEach(function(city) {
    var btn = document.createElement("button");
    btn.textContent = city;
    btn.addEventListener("click", function() {
      cLog("sync", '[EVENT] History chip clicked → <span class="hl">"' + city + '"</span>');
      cityInput.value = city;
      search(city);
    });
    historyBox.appendChild(btn);
  });
}

function clearHistory() {
  localStorage.removeItem("weatherHistory");
  cLog("info", "History cleared.");
  showHistory();
}

async function search(city) {
  cLog("sync", '[CALL STACK] search("' + city + '") — synchronous start.');
  weatherBox.innerHTML = '<div class="loading-text">🔍 Fetching weather for ' + city + '...</div>';

  Promise.resolve().then(function() {
    cLog("promise", "[MICROTASK] Promise.resolve().then() — runs before setTimeout.");
  });

  setTimeout(function() {
    cLog("callback", "[MACROTASK] setTimeout(0) — runs after all microtasks.");
  }, 0);

  cLog("sync", "[CALL STACK] Sync code continues after scheduling tasks.");

  try {
    var data = await getWeather(city);
    cLog("success", 'Weather data received for <span class="hl">' + data.name + '</span>.');
    renderWeather(data);
    saveHistory(data.name);
    cityInput.value = "";
  } catch (error) {
    cLog("error", "[CATCH] " + error.message);
    weatherBox.innerHTML = '<div class="error-text">⚠️ ' + error.message + '</div>';
  } finally {
    cLog("info", "[FINALLY] Search complete — always runs.");
  }
}

document.querySelectorAll(".tip-chip").forEach(function(chip) {
  chip.addEventListener("click", function() {
    var city = chip.textContent;
    cLog("sync", '[TIP] Clicked → <span class="hl">"' + city + '"</span>');
    cityInput.value = city;
    search(city);
  });
});

searchBtn.addEventListener("click", function() {
  var city = cityInput.value.trim();
  if (city) { cLog("sync", "[EVENT] 'click' on Search button."); search(city); }
});

cityInput.addEventListener("keydown", function(e) {
  if (e.key === "Enter") {
    var city = cityInput.value.trim();
    if (city) { cLog("sync", "[EVENT] Enter key pressed."); search(city); }
  }
});

clearHistBtn.addEventListener("click", function() {
  cLog("sync", "[EVENT] Clear History clicked.");
  clearHistory();
});

clearConsoleBtn.addEventListener("click", function() {
  consoleBox.innerHTML = "";
  cLog("sync", "Console cleared.");
});

cLog("sync", "[INIT] Script loaded — DOM ready.");
cLog("sync", "[INIT] Event listeners registered.");
cLog("info", "[INIT] OpenWeatherMap API ready.");
cLog("async", "[EVENT LOOP] Call stack empty — awaiting input...");
showHistory();
