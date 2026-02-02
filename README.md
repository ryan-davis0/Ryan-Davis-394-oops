# Random Weather

A full-stack TypeScript application that displays weather information for randomly selected cities around the world. Built with **Express.js** backend and **React** frontend using **Vite**.

## Features

- **Random City Selection**: Picks from 200+ real cities worldwide from a local GeoNames dataset
- **Reverse Geocoding**: Uses OpenStreetMap Nominatim API to get detailed location information
- **Live Weather Data**: Fetches real-time weather from Open-Meteo API (no API key required!)
- **24-Hour Forecast**: Shows hourly temperature and wind speed predictions
- **Beautiful React UI**: Modern, responsive design with smooth animations
- **Robust Error Handling**: Automatic retry logic with up to 10 attempts for geocoding
- **No API Keys Required**: Both Nominatim and Open-Meteo are free, keyless APIs

## Tech Stack

### Backend
- **Node.js** (v18+)
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Native Fetch API** - HTTP requests (Node 18+)

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **CSS3** - Styling with custom properties

### External APIs
- **[OpenStreetMap Nominatim](https://nominatim.openstreetmap.org)** - Reverse geocoding
- **[Open-Meteo](https://open-meteo.com)** - Weather data

## Project Structure

```
random-weathers/
├── src/
│   └── server.ts          # Express server with API endpoint
├── data/
│   └── cities.json        # GeoNames cities dataset (200+ cities)
├── client/                # React frontend
│   ├── src/
│   │   ├── main.tsx       # React entry point
│   │   ├── App.tsx        # Main application component
│   │   ├── App.css        # Component styles
│   │   ├── index.css      # Global styles
│   │   └── types.ts       # TypeScript interfaces
│   ├── public/
│   │   └── weather-icon.svg
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
├── package.json           # Root package.json
├── tsconfig.json          # Server TypeScript config
└── README.md
```

## Prerequisites

- **Node.js v18.0.0 or higher** (required for native fetch API)
- **npm** (comes with Node.js)

To check your Node version:
```bash
node --version
```

## Installation

1. **Clone or navigate to the project directory**:
   ```bash
   cd random-weathers
   ```

2. **Install all dependencies** (server and client):
   ```bash
   npm run install:all
   ```

   Or install separately:
   ```bash
   # Install server dependencies
   npm install

   # Install client dependencies
   cd client
   npm install
   cd ..
   ```

## Running the Application

### Development Mode (Recommended for Development)

Run both the server and client with hot reloading:

```bash
npm run dev
```

This starts:
- **Express server** on `http://localhost:4200`
- **Vite dev server** on `http://localhost:5173` (with proxy to API)

Access the app at: **http://localhost:5173**

### Production Mode

1. **Build the project**:
   ```bash
   npm run build
   ```

   This compiles:
   - TypeScript server to `dist/`
   - React client to `client/dist/`

2. **Start the production server**:
   ```bash
   npm start
   ```

3. Access the app at: **http://localhost:4200**

### Individual Commands

```bash
# Build server only
npm run build:server

# Build client only
npm run build:client

# Run server in development (with ts-node)
npm run dev:server

# Run client in development (Vite)
npm run dev:client
```

## API Reference

### GET /api/randomWeather

Returns weather data for a randomly selected city.

#### Success Response (200 OK)

```json
{
  "chosenPlace": {
    "displayName": "Tokyo, Kanto Region, Japan",
    "country": "Japan",
    "latitude": 35.6762,
    "longitude": 139.6503,
    "timezone": "Asia/Tokyo"
  },
  "forecast": {
    "current": {
      "temperature": 22,
      "temperatureUnit": "°C",
      "windSpeed": 15,
      "windSpeedUnit": "km/h"
    },
    "hourly": [
      {
        "time": "2024-01-15T14:00",
        "temperature": 22,
        "windSpeed": 15
      },
      // ... 23 more hours
    ]
  },
  "dataSources": {
    "geocoding": "OpenStreetMap Nominatim (https://nominatim.openstreetmap.org)",
    "weather": "Open-Meteo (https://open-meteo.com)"
  }
}
```

#### Error Response (503 Service Unavailable)

```json
{
  "error": "Service Unavailable",
  "message": "Unable to resolve a valid location after multiple attempts. The geocoding service may be temporarily unavailable or rate-limited. Please try again in a few moments."
}
```

## What It Means to Use React

This project uses **React** for the frontend, which provides several advantages over vanilla HTML/JS:

### React Benefits

1. **Component-Based Architecture**: The UI is built from reusable, self-contained components (`App.tsx`), making code more organized and maintainable.

2. **Declarative UI**: You describe *what* the UI should look like based on state, and React handles updating the DOM efficiently.

3. **State Management**: React's `useState` hook manages application state (weather data, loading status, errors) in a predictable way.

4. **Virtual DOM**: React uses a virtual DOM to minimize actual DOM manipulations, improving performance.

5. **Type Safety with TypeScript**: Combined with TypeScript, React provides excellent type checking for props and state.

### How React Works in This Project

```tsx
// State declarations
const [weather, setWeather] = useState<WeatherResponse | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

// When button is clicked, state changes trigger re-renders
const fetchRandomWeather = async () => {
  setLoading(true);  // UI shows loading spinner
  const data = await fetch('/api/randomWeather');
  setWeather(data);  // UI updates to show weather
  setLoading(false); // Loading spinner disappears
};
```

### Comparison: React vs Vanilla JS

| Aspect | Vanilla HTML/JS | React |
|--------|-----------------|-------|
| DOM Updates | Manual `getElementById`, `innerHTML` | Automatic based on state |
| Code Organization | Multiple files, manual wiring | Component-based, imports |
| State Management | Global variables, manual sync | Hooks (`useState`) |
| Build Process | None (or simple bundling) | Vite handles bundling, HMR |
| Developer Experience | Manual refresh, debugging | Hot reload, React DevTools |

## Configuration

### Environment

The server runs on port **4200** by default. To change this, modify the `PORT` constant in `src/server.ts`.

### Timeouts

External API requests have a 10-second timeout. This can be adjusted in the `fetchWithTimeout` function.

### Rate Limiting

The Nominatim API has rate limits. The server includes a ~1.1 second delay between retry attempts to respect these limits.

## Troubleshooting

### "fetch is not defined"
Make sure you're using Node.js v18 or higher. The native `fetch` API was added in Node 18.

### "Cannot find module" errors
Run `npm run install:all` to install all dependencies.

### CORS errors in development
The Vite dev server is configured to proxy `/api` requests to the Express server. Make sure both servers are running.

### Geocoding keeps failing
The Nominatim API may be rate-limiting your requests. Wait a minute and try again. The server automatically retries up to 10 times with delays.

## License

MIT

## Acknowledgments

- **[OpenStreetMap Nominatim](https://nominatim.openstreetmap.org)** - Free geocoding service
- **[Open-Meteo](https://open-meteo.com)** - Free weather API
- **[GeoNames](https://www.geonames.org)** - City database inspiration
