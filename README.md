# WeatherNest

<br>

## Overview

**WeatherNest** is a weather intelligence dashboard built to answer a question most weather apps don’t:  
> “What do I actually need to do to prep for the next few hours outside?”

Instead of only showing raw numbers, WeatherNest:
- Analyzes the next 24 hours
- Detects worst-case shifts (wind, rain, UV, cold, heat, etc.)
- Generates **human, real-world prep guidance**
- Dynamically adapts UI theme + background to the real weather
- Surfaces **warnings + severe weather alerts** proactively

WeatherNest blends data, safety, and design into a single, calming experience.

<br>

---

## MVP

- _Search by City / Zip OR use live GPS_
- _Dynamic weather background system_
- _Light / Dark UI determined by real image brightness_
- _“How to Prep” real-world guidance engine_
- _Next 24 hours forecast panel_
- _3-day quick daily forecast_
- _Inclement weather auto-detection + alerts_
- _Responsive design (desktop, tablet, mobile)_
- _Google Places Autocomplete_
- _Deployed and production-ready_

<br>

---

## Goals

- _Make weather **actionable**, not just informational_
- _Remove overwhelm — design should feel calm, readable, humane_
- _Handle edge cases (tornado, blizzard, hurricane, sandstorm, etc.)_
- _Ensure clarity when severe weather is approaching_
- _Mobile experience should feel great, not “shrunk”_

<br>

---

## Libraries & Dependencies

| Library / Service | Purpose |
|------------------|---------|
| React | UI framework |
| WeatherAPI | Live weather + forecast data |
| Google Places API | Search autocomplete + location intelligence |
| FontAwesome | Icons |
| CSS Grid / Flexbox | Layout responsiveness |
| Custom Algorithms | Prep Engine + Warning Engine |
| Vite | Build tooling |
| Firebase Hosting | Deployment |

<br>

---

## 🌦 UI — Screens

**“How to prep for next 24 hours” (Tablet View)**  
![Prep Tablet](https://i.imgur.com/dLw2tjz.png)

<br>

**Weather Alert System (Web View)**  
![Alert](https://i.imgur.com/BzxX0RS.png)

<br>

**Full Dashboard (Web View)**  
![Full UI](https://i.imgur.com/eavAWbg.png)

<br>

**Dynamic Live Weather Background (Mobile)**  
![Mobile Background](https://i.imgur.com/FwnWN1K.png)

<br>

---

## Client Architecture

~~~text
src
|__ assets/
|   |__ gifs/
|   |__ images/
|
|__ utils/
|   |__ colorHelper.js
|
|__ components/
|   |__ PrepPanel/
|   |__ WeatherPanels/
|
|__ App.jsx
|__ App.css
|__ main.jsx
~~~

<br>

---

## ⭐ Code Showcase — Weather Intelligence Engine

This isn’t a “theme swapper” app.  
WeatherNest **thinks**.

Two core systems power it:

### 1️⃣ Dynamic Background Engine
Maps real conditions → cinematic animated environments

~~~js
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

function pickBackground(conditionText = "") {
  if (exactConditionMap[conditionText]) return exactConditionMap[conditionText];
  const t = String(conditionText).toLowerCase();

  if (t.includes("tornado")) return BG.tornado;
  if (t.includes("hurricane")) return BG.hurricane;
  if (t.includes("sand") || t.includes("dust")) return BG.sand;
  if (t.includes("thunder")) return BG.thunder;
  if (t.includes("storm")) return BG.stormy;
  if (t.includes("snow")) return BG.snow;
  if (t.includes("drizzle")) return BG.drizzle;
  if (t.includes("rain")) return BG.rain;
  if (t.includes("fog") || t.includes("mist") || t.includes("haze")) return BG.fog;
  if (t.includes("overcast")) return BG.overcast;
  if (t.includes("partly")) return BG.partly;
  if (t.includes("cloud")) return BG.cloudy;

  return BG.clear;
}
~~~

WeatherNest even measures **GIF brightness**, automatically switching UI theme to readable light or dark mode.

<br>

---

### 2️⃣ “How To Prep” Intelligence
Turns raw forecast into human-language action

~~~js
function buildPrepTips(current, upcomingHours, hoursOut = 1) {
  const tips = [];
  const baseFeels = Number(current.feelslike_f);
  const wind = Math.max(...upcomingHours.map(h => h.wind_mph));
  const rain = Math.max(...upcomingHours.map(h => h.chance_of_rain));
  const uv = Math.max(...upcomingHours.map(h => h.uv));

  if (baseFeels <= 35) tips.push({ icon: "🧣", text: "Cold — layer up and protect hands." });
  if (baseFeels >= 85) tips.push({ icon: "🧢", text: "Hot — hydrate and wear breathable clothing." });
  if (wind >= 20) tips.push({ icon: "💨", text: "Windy — add a windbreaker and secure loose items." });
  if (rain >= 50) tips.push({ icon: "☔️", text: "Rain likely — bring an umbrella or shell." });
  if (uv >= 7) tips.push({ icon: "🧴", text: "High UV — sunscreen + sunglasses recommended." });

  if (!tips.length)
    tips.push({ icon: "✅", text: "Looks comfortable — normal clothing is perfect." });

  return tips;
}
~~~

<br>

---

### 3️⃣ Severe Weather Detection
Warns proactively with real messaging

~~~js
function detectWeatherWarning(current, upcomingHours, alertsArray) {
  if (alertsArray?.length)
    return { title: alertsArray[0].headline, body: alertsArray[0].desc };

  const severeHour = upcomingHours.find(h => {
    const t = (h.condition.text || "").toLowerCase();
    return t.includes("tornado") || t.includes("hurricane") || t.includes("thunder") || h.gust_mph >= 35;
  });

  if (!severeHour) return null;

  return {
    title: "Heads up — inclement weather possible",
    body: `${severeHour.condition.text} expected soon. Consider adjusting plans.`
  };
}
~~~

<br>

---

## Code Issues & Resolutions

- **Issue:** Weather GIF brightness made UI unreadable  
  **Fix:** Dynamic brightness → theme switching

- **Issue:** Forecasts overwhelm average users  
  **Fix:** Human prep summaries + “worst-case” logic

- **Issue:** Severe alerts needed to be useful, not scary  
  **Fix:** Calm language + dismissible UX

<br>

---

## Post-MVP

- Save favorite cities
- Push notifications
- Shareable “prep summary”
- Accessibility enhancements
- Performance optimizations
- Apple Watch + Mobile app version

<br>

---

WeatherNest helps people not just know the weather —  
It helps them **live better with it.**