# TimiGuessr

A GeoGuessr-style game set in Timișoara, built for **UniHack 2026** (Civicore track).
Players are shown a photo of a real location in the city and must place a pin on the map.
Each round then reveals the true location, awards points based on distance, and unlocks a
short story about the place.

The result is a five-round game that works both as a challenge and as a compact,
self-earned tour of Timișoara.

> Tourists don't learn a city from guides — they learn it by playing.

---

## Overview

TimiGuessr turns the city into a playable map. Instead of reading a guide, the player
guesses where each photo was taken. Accuracy determines both the score and how much of the
location's story is revealed:

- A close guess unlocks the full story.
- A medium guess unlocks the first sentence.
- A far guess or a timeout keeps the story locked.

Nothing is given away for free — the final results screen only shows the information the
player actually earned.

---

## Gameplay

1. **Start** — begin a game from the start screen.
2. **Guess** — a photo is shown for 60 seconds. Click the map to place a pin, then confirm.
3. **Reveal** — the true location is drawn on the map with a line from the guess, points are
   awarded, and the earned part of the story is unlocked.
4. **Repeat** — five rounds, each with a new location.
5. **Results** — total score out of 25,000, a per-round breakdown, an earned-info recap,
   and the option to save the score to the leaderboard.

If the timer reaches zero, the round is submitted automatically using the pin currently
placed on the map. If no pin was placed, the round scores zero points.

---

## Scoring

Points are based on the distance between the guess and the real location:

```js
distance  = haversine(guess, truth)                 // meters
effective = Math.max(0, distance - 200)             // 200 m tolerance
points    = Math.round(5000 * Math.exp(-effective / 1000))
```

- Maximum per round: **5,000**
- Maximum per game: **25,000**
- Guesses within **200 m** score the maximum
- Beyond that, the score decays exponentially

The same score thresholds drive the learning tiers:

| Tier | Points | Approx. distance | Story shown |
|---|---|---|---|
| Close | ≥ 3000 | ≤ 710 m | Full story, neighborhood, photo credit |
| Medium | ≥ 750 | ≤ 2.1 km | First sentence only |
| Far / timeout | < 750 | > 2.1 km | Story locked |

---

## Features

- 23 curated Timișoara locations across multiple neighborhoods
- Five-round games built from a shuffled deck of locations
- 60-second round timer with automatic timeout submission
- Interactive map with distance-based scoring
- Guess-to-location comparison drawn on the map after confirmation
- Proximity-gated stories: the closer the guess, the more you learn
- Results recap limited to the information actually unlocked
- Persistent top-10 leaderboard in `localStorage`
- Responsive layout: photo and map side by side on desktop, stacked on mobile
- No backend, no API keys, no runtime data fetching

---

## Tech stack

| Technology | Version | Role |
|---|---|---|
| React | 18 | UI and state management |
| Vite | 5 | Development server and production build |
| react-leaflet | 4 | Map components |
| Leaflet | 1.9 | Mapping engine |
| OpenStreetMap tiles | — | Free map imagery |
| CSS | — | Custom responsive design system |
| `localStorage` | — | Client-side leaderboard persistence |
| Static JSON | — | Location dataset |

The application is entirely client-side. The location data is bundled at build time, and
the leaderboard lives in the browser.

---

## Getting started

### Requirements

- Node.js 18 or newer
- npm

### Install and run

```bash
npm install
npm run dev
```

Open the URL printed by Vite (by default <http://localhost:5173>).

### Production build

```bash
npm run build
npm run preview
```

---

## Project structure

```text
src/
  App.jsx                    Screen state machine and game flow
  main.jsx                   React entry point
  index.css                  Design system and responsive layout
  components/
    StartScreen.jsx          Landing screen
    GameRound.jsx            Photo, timer and map for one round
    GuessMap.jsx             Interactive map and pin placement
    RevealCard.jsx           Per-round result and unlocked story
    ResultScreen.jsx         Final score, breakdown and recap
    Leaderboard.jsx          Top-10 leaderboard and storage helpers
  hooks/
    useTimer.js              Countdown hook
  utils/
    score.js                 Haversine distance and scoring
    facts.js                 Story normalization helpers
  data/
    spots.json               Curated location dataset
```

### Application flow

`App.jsx` holds a single state object and moves through four screens:

```text
start -> round -> reveal -> round -> ... -> results -> start
```

The current round is keyed by its index so the timer resets cleanly between rounds.

The map reports the current pin through `onPinChange({ lat, lng })`. If the 60-second
timer expires, the round submits that pin (or scores zero when no pin was placed).

---

## Location data

Each entry in `src/data/spots.json` follows this shape:

```json
{
  "id": 1,
  "name": "Union Square (Piața Unirii)",
  "lat": 45.7576,
  "lng": 21.2290,
  "photo": "https://upload.wikimedia.org/...",
  "attribution": "Photo: Author — CC BY-SA 4.0",
  "facts": [
    "First complete sentence about the place.",
    "A second fact."
  ],
  "neighborhood": "Cetate",
  "difficulty": 1
}
```

Stories are stored as an array of complete sentences. The `facts.js` helper also accepts
the older single-string `fact` field, so both formats render correctly.

Photos are hosted on Wikimedia Commons. Each image keeps its author and license in the
`attribution` field.

---

## Leaderboard

Scores are stored in `localStorage` under the key `timiguessr-scores`:

```json
[{ "name": "Player", "score": 18450, "date": "2026-11-14T12:00:00.000Z" }]
```

Only the top 10 scores are kept, sorted in descending order. Malformed or unavailable
storage fails gracefully without breaking the results screen.

---

## Credits

Built at **UniHack 2026** by a three-person team:

- Map, distance calculation and scoring
- Game flow, screens and leaderboard
- Data curation, visual design and presentation

Photography is sourced from Wikimedia Commons under the licenses recorded per location in
`spots.json`.
