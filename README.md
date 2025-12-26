# WeatherNest

## Overview

**WeatherNest** is a smart, human-friendly weather assistant.  
Instead of just showing numbers, it helps people *prepare*.

WeatherNest combines real-time weather data with simple, practical intelligence:

- Beautiful UI with dynamic animated backgrounds  
- “How to prep for the next X hours” guidance  
- Clear severe weather warnings  
- Next 24-hour outlook  
- Multi-day forecast  
- Location search + GPS locate  

It’s designed for real life—families planning a day, runners deciding what to wear, photographers timing shots, and anyone who wants weather that *means something*.

---

## MVP

- Search by city, zip, or GPS
- Dynamic backgrounds that match live conditions
- “How to prep” tips engine
- Severe weather detection + warning modal
- 24-hour forecast strip
- 3-day forecast preview
- Fully responsive layout
- Production deployed

---

## Goals

- Make weather understandable at a glance  
- Turn raw data into actionable guidance  
- Be visually immersive without being noisy  
- Stay performant  
- Feel like a polished app, not a coding demo  

---

## Libraries & Dependencies

| Library / Service           | Purpose                           |
|-----------------------------|-----------------------------------|
| React                       | Front-end UI                      |
| Vite                        | Build tooling                     |
| WeatherAPI                  | Weather + forecast data           |
| Google Places Autocomplete  | Clean location searching          |
| FontAwesome                 | Icons                             |
| Custom GIF backgrounds      | Dynamic visual experience         |

---

## UI — Screens

**How to Prep — Tablet View**  
https://i.imgur.com/dLw2tjz.png  

**Severe Weather Alert — Web View**  
https://i.imgur.com/BzxX0RS.png  

**Full Dashboard — Web View**  
https://i.imgur.com/eavAWbg.png  

**Dynamic Backgrounds — Mobile View**  
https://i.imgur.com/FwnWN1K.png  

---

## Client Architecture

~~~text
src
|__ assets/
|   |__ weathernest-long.png
|   |__ weather gifs (animated)
|
|__ utils/
|   |__ colorHelper.js
|
|__ App.css
|__ App.jsx
|__ index.jsx
~~~

---

## ⭐ Code Showcase — API + Intelligence

WeatherNest doesn’t just display weather — it interprets it.

This logic powers:
- Dynamic animated backgrounds  
- Severe weather warnings  
- “How to prep” behavior  
- 24-hour projections  

**Prep windows logic**

~~~js
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
~~~

**Weather fetch + interpretation**

~~~js
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

      // Animated background
      const conditionText = data.current?.condition?.text || "";
      setBackgroundSrc(pickBackground(conditionText));

      // Warning system
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
  } catch {
    setError("Error fetching weather data.");
    setWeather(null);
    setForecast(null);
    setWarning(null);
    setShowWarning(false);
  } finally {
    setIsLoading(false);
  }
};
~~~

This approach allows WeatherNest to be:

- Responsive  
- Context-aware  
- Actually helpful  
- Pleasant to use  

---

## Post-MVP Ideas

- Animated radar
- “Plan my day” timeline mode
- Saved locations
- Push storm notifications
- Accessibility / reduced-motion

---

## Code Issues & Resolutions

- **Text unreadable on some backgrounds**  
  ✔ Auto-detect brightness → automatic light/dark theme  

- **Users needed actionable advice**  
  ✔ Built prep-tips intelligence engine  

- **Alerts were easy to miss**  
  ✔ Full warning modal + severity context  

---

## Final Thought

WeatherNest is built to make weather feel like something you can *use* — not just something you look at.