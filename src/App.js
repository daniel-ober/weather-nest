import React, { useState, useRef, useEffect, useMemo } from "react";
import "./App.css";
import { LoadScript, Autocomplete } from "@react-google-maps/api";
import logo from "./assets/weathernest-long.png";
import { getImageBrightness } from "./utils/colorHelper";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationCrosshairs } from "@fortawesome/free-solid-svg-icons";

/** ✅ Import assets explicitly (no dynamic require) */
import clearGif from "./assets/clear.gif";
import cloudsGif from "./assets/clouds.gif";
import drizzleGif from "./assets/drizzle.gif";
import fogGif from "./assets/fog.gif";
import hurricaneGif from "./assets/hurricane.gif";
import overcastGif from "./assets/overcast.gif";
import partlyCloudyGif from "./assets/partly-cloudy.gif";
import rainGif from "./assets/rain.gif";
import sandstormGif from "./assets/sandstorm.gif";
import snowGif from "./assets/snow.gif";
import stormyGif from "./assets/stormy.gif";
import thunderstormGif from "./assets/thunderstorm.gif";
import tornadoGif from "./assets/tornado.gif";

const libraries = ["places"];

/** Canonical background choices */
const BG = {
  clear: clearGif,
  partly: partlyCloudyGif,
  cloudy: cloudsGif,
  overcast: overcastGif,
  fog: fogGif,
  drizzle: drizzleGif,
  rain: rainGif,
  stormy: stormyGif,
  thunder: thunderstormGif,
  snow: snowGif,
  tornado: tornadoGif,
  hurricane: hurricaneGif,
  sand: sandstormGif,
};

/**
 * Robust condition → background mapping.
 */
const exactConditionMap = {
  Sunny: BG.clear,
  Clear: BG.clear,
  "Partly cloudy": BG.partly,
  Cloudy: BG.cloudy,
  Overcast: BG.overcast,
  Mist: BG.fog,
  Fog: BG.fog,

  "Patchy rain possible": BG.rain,
  "Patchy light drizzle": BG.drizzle,
  "Light drizzle": BG.drizzle,
  Drizzle: BG.drizzle,

  "Light rain": BG.rain,
  "Moderate rain": BG.rain,
  "Heavy rain": BG.rain,
  "Torrential rain shower": BG.stormy,

  "Thundery outbreaks possible": BG.thunder,
  Thunderstorm: BG.thunder,

  Snow: BG.snow,
  "Patchy snow possible": BG.snow,
  "Moderate or heavy snow": BG.snow,
  Blizzard: BG.snow,

  Tornado: BG.tornado,
  Hurricane: BG.hurricane,
  Sandstorm: BG.sand,
  Dust: BG.sand,
};

const PREP_WINDOWS = [
  { key: "now", label: "Current", hours: 0 },
  { key: "1h", label: "Next hour", hours: 1 },
  { key: "3h", label: "3 hours", hours: 3 },
  { key: "6h", label: "6 hours", hours: 6 },
  { key: "9h", label: "9 hours", hours: 9 },
  { key: "12h", label: "12 hours", hours: 12 },
  { key: "24h", label: "24 hours", hours: 24 },
  { key: "48h", label: "48 hours", hours: 48 },
];

function pickBackground(conditionText = "") {
  if (exactConditionMap[conditionText]) return exactConditionMap[conditionText];

  const t = String(conditionText).toLowerCase();

  // Most severe first
  if (t.includes("tornado")) return BG.tornado;
  if (t.includes("hurricane") || t.includes("typhoon")) return BG.hurricane;
  if (t.includes("sand") || t.includes("dust")) return BG.sand;

  if (t.includes("thunder")) return BG.thunder;
  if (t.includes("storm")) return BG.stormy;

  if (
    t.includes("snow") ||
    t.includes("sleet") ||
    t.includes("ice") ||
    t.includes("blizzard")
  )
    return BG.snow;

  if (t.includes("drizzle")) return BG.drizzle;
  if (t.includes("rain") || t.includes("shower")) return BG.rain;

  if (t.includes("fog") || t.includes("mist") || t.includes("haze"))
    return BG.fog;

  if (t.includes("overcast")) return BG.overcast;
  if (t.includes("partly")) return BG.partly;
  if (t.includes("cloud")) return BG.cloudy;

  return BG.clear;
}

/**
 * Builds tips for a chosen "outdoor window" (0h = current, else next N hours).
 */
function buildPrepTips(current, hoursWindow, hoursOut = 1) {
  if (!current) return [];

  const tips = [];

  const baseTemp = Number(current.temp_f);
  const baseFeels = Number(current.feelslike_f);
  const baseWind = Number(current.wind_mph);
  const baseGust = Number(current.gust_mph || 0);
  const baseHumidity = Number(current.humidity);
  const baseUv = Number(current.uv);

  const hours = Array.isArray(hoursWindow) ? hoursWindow : [];
  const slice = hoursOut > 0 ? hours.slice(0, hoursOut) : [];

  const agg = slice.reduce(
    (acc, h) => {
      const temp = Number(h?.temp_f ?? NaN);
      const feels = Number(h?.feelslike_f ?? NaN);
      const wind = Number(h?.wind_mph ?? NaN);
      const gust = Number(h?.gust_mph ?? 0);
      const humidity = Number(h?.humidity ?? NaN);
      const uv = Number(h?.uv ?? NaN);
      const rain = Number(h?.chance_of_rain ?? 0);
      const snow = Number(h?.chance_of_snow ?? 0);
      const cond = String(h?.condition?.text || "").toLowerCase();

      if (!Number.isNaN(temp)) {
        acc.minTemp = Math.min(acc.minTemp, temp);
        acc.maxTemp = Math.max(acc.maxTemp, temp);
      }
      if (!Number.isNaN(feels)) acc.minFeels = Math.min(acc.minFeels, feels);
      if (!Number.isNaN(wind)) acc.maxWind = Math.max(acc.maxWind, wind);
      acc.maxGust = Math.max(acc.maxGust, gust);
      if (!Number.isNaN(humidity))
        acc.maxHumidity = Math.max(acc.maxHumidity, humidity);
      if (!Number.isNaN(uv)) acc.maxUv = Math.max(acc.maxUv, uv);
      acc.maxRain = Math.max(acc.maxRain, rain);
      acc.maxSnow = Math.max(acc.maxSnow, snow);

      if (cond.includes("thunder")) acc.flags.thunder = true;
      if (cond.includes("storm")) acc.flags.storm = true;
      if (
        cond.includes("snow") ||
        cond.includes("sleet") ||
        cond.includes("ice") ||
        cond.includes("blizzard")
      )
        acc.flags.wintry = true;

      return acc;
    },
    {
      minTemp: Infinity,
      maxTemp: -Infinity,
      minFeels: Infinity,
      maxWind: 0,
      maxGust: 0,
      maxHumidity: 0,
      maxUv: 0,
      maxRain: 0,
      maxSnow: 0,
      flags: { thunder: false, storm: false, wintry: false },
    }
  );

  const useWindow = hoursOut > 0 && slice.length > 0;
  const feels = useWindow ? agg.minFeels : baseFeels;
  const wind = useWindow ? agg.maxWind : baseWind;
  const gust = useWindow ? agg.maxGust : baseGust;
  const humidity = useWindow ? agg.maxHumidity : baseHumidity;
  const uv = useWindow ? agg.maxUv : baseUv;
  const chanceRain = useWindow ? agg.maxRain : 0;
  const chanceSnow = useWindow ? agg.maxSnow : 0;

  const label =
    hoursOut === 0
      ? "right now"
      : hoursOut === 1
      ? "the next hour"
      : `the next ${hoursOut} hours`;

  if (feels <= 20)
    tips.push({
      icon: "🧥",
      text: `Bitter cold for ${label}: heavy coat, gloves, and a hat. Cover exposed skin.`,
    });
  else if (feels <= 35)
    tips.push({
      icon: "🧣",
      text: `Cold for ${label}: warm jacket + layers. Gloves help a lot.`,
    });
  else if (feels <= 50)
    tips.push({
      icon: "🧥",
      text: `Chilly for ${label}: light jacket or hoodie is a good call.`,
    });
  else if (feels >= 85)
    tips.push({
      icon: "🧢",
      text: `Hot for ${label}: breathable clothing + water. Take shade breaks.`,
    });

  if (wind >= 18 || gust >= 25)
    tips.push({
      icon: "💨",
      text: `Wind picks up within ${label}: add a windbreaker and secure hats/loose items.`,
    });

  if (chanceRain >= 50)
    tips.push({
      icon: "☔️",
      text: `Rain is likely within ${label}: bring an umbrella or waterproof shell.`,
    });

  if (chanceSnow >= 40)
    tips.push({
      icon: "🥾",
      text: `Snow is possible within ${label}: warm footwear with traction helps.`,
    });

  if (useWindow && agg.flags.thunder)
    tips.push({
      icon: "⛈️",
      text: `Thunder risk within ${label}: consider limiting time outside and avoid open areas.`,
    });

  if (useWindow && agg.flags.wintry)
    tips.push({
      icon: "🧊",
      text: `Wintry conditions possible within ${label}: watch for slick spots and reduced visibility.`,
    });

  if (humidity >= 80 && baseTemp >= 70)
    tips.push({
      icon: "💧",
      text: `Humid stretch within ${label}: it’ll feel heavier—light fabrics help.`,
    });

  if (uv >= 7)
    tips.push({
      icon: "🧴",
      text: `High UV within ${label}: sunscreen + sunglasses recommended.`,
    });
  else if (uv >= 4)
    tips.push({
      icon: "😎",
      text: `Moderate UV within ${label}: sunglasses are a nice quality-of-life upgrade.`,
    });

  if (tips.length === 0)
    tips.push({
      icon: "👌",
      text: `Looks comfortable for ${label} — dress normally.`,
    });

  return tips;
}

/** Inclement weather detector (for popup) */
function detectWeatherWarning(current, upcomingHours, alertsArray) {
  if (Array.isArray(alertsArray) && alertsArray.length > 0) {
    const top = alertsArray[0];
    return {
      title: top.headline || "Weather Alert",
      body: top.desc || "There is an active weather alert for this area.",
      severity: top.severity || "alert",
    };
  }

  if (!current || !upcomingHours?.length) return null;

  const severeHour = upcomingHours.find((h) => {
    const t = (h?.condition?.text || "").toLowerCase();
    const gust = Number(h?.gust_mph || 0);
    const chanceRain = Number(h?.chance_of_rain || 0);
    const chanceSnow = Number(h?.chance_of_snow || 0);

    if (t.includes("thunder")) return true;
    if (t.includes("tornado") || t.includes("hurricane")) return true;
    if (gust >= 35) return true;
    if (chanceRain >= 80 && (t.includes("heavy") || t.includes("storm")))
      return true;
    if (chanceSnow >= 70 && (t.includes("heavy") || t.includes("blizzard")))
      return true;

    return false;
  });

  if (!severeHour) return null;

  const when = severeHour.time
    ? new Date(severeHour.time).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })
    : "soon";
  const label = severeHour?.condition?.text || "Inclement weather";

  return {
    title: "Heads up — inclement weather possible",
    body: `${label} expected around ${when}. Consider adjusting plans and prepping now.`,
    severity: "warning",
  };
}

function App() {
  const [query, setQuery] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [locationName, setLocationName] = useState("");
  const [error, setError] = useState("");
  const [theme, setTheme] = useState("dark");
  const [backgroundSrc, setBackgroundSrc] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [prepWindowKey, setPrepWindowKey] = useState("1h");

  const [warning, setWarning] = useState(null);
  const [showWarning, setShowWarning] = useState(false);

  const autocompleteRef = useRef(null);

  const weatherApiKey = process.env.REACT_APP_WEATHERAPI_KEY;
  const googleKey = process.env.REACT_APP_GOOGLE_PLACES_API_KEY;

  useEffect(() => {
    if (backgroundSrc) {
      getImageBrightness(backgroundSrc, (brightness) => {
        const threshold = 130;
        setTheme(brightness > threshold ? "light" : "dark");
      });
    }
  }, [backgroundSrc]);

  const now = useMemo(() => new Date(), [forecast]);

  // ✅ EXACT next 24 hours (not 48)
  const upcomingHours = useMemo(() => {
    if (!forecast) return [];
    const hours = [
      ...forecast.forecastday[0].hour,
      ...(forecast.forecastday[1]?.hour || []),
    ];

    return hours.filter((h) => new Date(h.time) > now).slice(0, 24);
  }, [forecast, now]);

  // ✅ Daily forecast: keep it tight + clean for the right panel
  const dailyDays = useMemo(() => {
    return forecast?.forecastday?.slice(0, 3) || [];
  }, [forecast]);

  const prepHoursOut = useMemo(() => {
    const found = PREP_WINDOWS.find((w) => w.key === prepWindowKey);
    return found ? found.hours : 1;
  }, [prepWindowKey]);

  const prepTips = useMemo(
    () => buildPrepTips(weather, upcomingHours, prepHoursOut),
    [weather, upcomingHours, prepHoursOut]
  );

  const formatTime12hr = (dateStr) => {
    const date = new Date(dateStr);
    const hour = date.getHours();
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:00 ${ampm}`;
  };

  const fetchWeatherData = async (q) => {
    if (!q) return;

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(
        `https://api.weatherapi.com/v1/forecast.json?key=${weatherApiKey}&q=${encodeURIComponent(
          q
        )}&days=7&aqi=no&alerts=yes`
      );

      const data = await res.json();

      if (data?.location) {
        setLocationName(`${data.location.name}, ${data.location.region}`);
        setWeather(data.current);
        setForecast(data.forecast);
        setLastUpdated(new Date());

        const conditionText = data.current?.condition?.text || "";
        setBackgroundSrc(pickBackground(conditionText));

        const alertsArray = data?.alerts?.alert || [];
        const hours = [
          ...data.forecast.forecastday[0].hour,
          ...(data.forecast.forecastday[1]?.hour || []),
        ];
        const next12 = hours
          .filter((h) => new Date(h.time) > new Date())
          .slice(0, 12);

        const w = detectWeatherWarning(data.current, next12, alertsArray);

        setWarning(w);
        setShowWarning(Boolean(w));
      } else {
        setError("Location not found.");
        setWeather(null);
        setForecast(null);
        setWarning(null);
        setShowWarning(false);
      }
    } catch (err) {
      setError("Error fetching weather data.");
      setWeather(null);
      setForecast(null);
      setWarning(null);
      setShowWarning(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace?.();
    if (place?.geometry?.location) {
      const loc = place.formatted_address || place.name;
      setQuery("");
      fetchWeatherData(loc);
    } else {
      setError("Unable to get location data.");
    }
  };

  const fetchWeatherByCoords = () => {
    setIsLocating(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const q = `${position.coords.latitude},${position.coords.longitude}`;
        fetchWeatherData(q);
        setIsLocating(false);
      },
      () => {
        setError("Unable to access your location.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <LoadScript googleMapsApiKey={googleKey} libraries={libraries}>
      <div className={`app ${theme}`}>
        {backgroundSrc && (
          <img
            src={backgroundSrc}
            className="weather-background fade-in"
            alt="Weather background"
            onError={(e) => (e.target.style.display = "none")}
          />
        )}

        <div className="bg-overlay" aria-hidden="true" />

        {showWarning && warning && (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <div className="modal">
              <div className="modal__titleRow">
                <div className="modal__title">{warning.title}</div>
                <button
                  className="modal__close"
                  onClick={() => setShowWarning(false)}
                  aria-label="Close warning"
                >
                  ✕
                </button>
              </div>
              <div className="modal__body">{warning.body}</div>
              <div className="modal__actions">
                <button
                  className="modal__btn"
                  onClick={() => setShowWarning(false)}
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="shell">
          <div className="dashboard">
            {/* LEFT */}
            <div className="left-panel">
              <header className="app-header">
                <img src={logo} alt="WeatherNest" className="logo" />
              </header>

              <div className="search-box">
                <Autocomplete
                  onLoad={(auto) => (autocompleteRef.current = auto)}
                  onPlaceChanged={handlePlaceChanged}
                  options={{
                    types: ["geocode"],
                    componentRestrictions: { country: "us" },
                  }}
                >
                  <div className="search-input-wrapper">
                    <input
                      type="text"
                      className="search-bar"
                      placeholder="Enter a city, address, or zip..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    <button
                      className="locate-btn"
                      onClick={fetchWeatherByCoords}
                      title="Use my location"
                      disabled={isLocating}
                    >
                      <FontAwesomeIcon icon={faLocationCrosshairs} />
                    </button>
                  </div>
                </Autocomplete>

                {isLocating && (
                  <div className="location-status">Getting your location...</div>
                )}
                {isLoading && (
                  <div className="location-status">Fetching forecast...</div>
                )}
              </div>

              {error && <div className="error-message">{error}</div>}

              {!weather && !error && !isLoading && (
                <div className="card hero-empty">
                  <div className="hero-empty__title">
                    Search a location to get started
                  </div>
                  <div className="hero-empty__sub">
                    Try a city, zip code, or tap the locate button.
                  </div>
                </div>
              )}

              {weather && (
                <>
                  <div className="card">
                    <div className="location-box">
                      <div className="location">{locationName}</div>
                      {lastUpdated && (
                        <div className="last-updated">
                          Last updated:{" "}
                          {lastUpdated.toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </div>
                      )}
                    </div>

                    <div className="weather-box">
                      <div className="weather">{weather.condition.text}</div>
                      <div className="temp">
                        <span className="temp-value">
                          {Math.round(weather.temp_f)}
                        </span>
                        <span className="temp-unit">°F</span>
                      </div>

                      <div className="metrics-row">
                        <div className="metric">
                          <div className="metric__label">Feels like</div>
                          <div className="metric__value">
                            {Math.round(weather.feelslike_f)}°
                          </div>
                        </div>
                        <div className="metric">
                          <div className="metric__label">Wind</div>
                          <div className="metric__value">
                            {Math.round(weather.wind_mph)} mph
                          </div>
                        </div>
                        <div className="metric">
                          <div className="metric__label">UV</div>
                          <div className="metric__value">{weather.uv}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="prep-head">
                      <div className="card__title prep-title">How to prep</div>

                      <div
                        className="prep-controls"
                        role="group"
                        aria-label="Outdoor duration"
                      >
                        <div className="prep-label">Outdoors for</div>

                        <div className="prep-chips" aria-label="Select duration">
                          {PREP_WINDOWS.map((w) => (
                            <button
                              key={w.key}
                              type="button"
                              className={`prep-chip ${
                                prepWindowKey === w.key ? "is-active" : ""
                              }`}
                              onClick={() => setPrepWindowKey(w.key)}
                            >
                              {w.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="prep-grid">
                      {prepTips.map((t, idx) => (
                        <div key={idx} className="prep-item">
                          <div className="prep-icon">{t.icon}</div>
                          <div className="prep-text">{t.text}</div>
                        </div>
                      ))}
                    </div>

                    <div className="prep-foot">
                      Tips adapt to the *worst-case* conditions within your
                      selected window.
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* RIGHT */}
            <div className="right-panel">
              {!forecast && weather && (
                <div className="card">
                  <div className="card__title">Forecast</div>
                  <div className="muted">Loading forecast…</div>
                </div>
              )}

              {forecast && (
                <>
                  <div className="card">
                    <div className="forecast-container">
                      <h3>Next 24 Hours</h3>
                      <div className="hourly-forecast">
                        {upcomingHours.map((hour, i) => (
                          <div key={i} className="forecast-hour">
                            <div>{formatTime12hr(hour.time)}</div>
                            <img
                              src={`https:${hour.condition.icon}`}
                              width="36"
                              alt=""
                            />
                            <div>{Math.round(hour.temp_f)}°</div>

                            <div className="mini-badges">
                              {Number(hour.chance_of_rain || 0) >= 40 && (
                                <span className="mini-badge">
                                  ☔ {hour.chance_of_rain}%
                                </span>
                              )}
                              {Number(hour.chance_of_snow || 0) >= 30 && (
                                <span className="mini-badge">
                                  ❄ {hour.chance_of_snow}%
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <h3>Next {dailyDays.length} Days</h3>
                      <div className="daily-forecast">
                        {dailyDays.map((day, i) => (
                          <div key={i} className="forecast-day">
                            <div>
                              {new Date(day.date + "T12:00:00").toLocaleDateString(
                                undefined,
                                { weekday: "short" }
                              )}
                            </div>
                            <img
                              src={`https:${day.day.condition.icon}`}
                              width="40"
                              alt=""
                            />
                            <div>
                              {Math.round(day.day.maxtemp_f)}° /{" "}
                              {Math.round(day.day.mintemp_f)}°
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {warning && !showWarning && (
                    <div className="card warning-card">
                      <div className="warning-title">⚠️ Weather warning</div>
                      <div className="warning-body">{warning.body}</div>
                      <button
                        className="warning-btn"
                        onClick={() => setShowWarning(true)}
                      >
                        View
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </LoadScript>
  );
}

export default App;