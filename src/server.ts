import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = 4200;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the React build folder
app.use(express.static(path.join(__dirname, '../client/dist')));

// Types
interface City {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  population: number;
}

interface NominatimResponse {
  display_name?: string;
  address?: {
    country?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
  };
}

interface OpenMeteoResponse {
  timezone: string;
  current?: {
    temperature_2m: number;
    wind_speed_10m: number;
  };
  hourly?: {
    time: string[];
    temperature_2m: number[];
    wind_speed_10m: number[];
  };
}

interface WeatherResponse {
  chosenPlace: {
    displayName: string;
    country: string;
    latitude: number;
    longitude: number;
    timezone: string;
  };
  forecast: {
    current: {
      temperature: number;
      temperatureUnit: string;
      windSpeed: number;
      windSpeedUnit: string;
    };
    hourly: Array<{
      time: string;
      temperature: number;
      windSpeed: number;
    }>;
  };
  dataSources: {
    geocoding: string;
    weather: string;
  };
}

// Load cities data
const citiesPath = path.join(__dirname, '../data/cities.json');
let cities: City[] = [];

try {
  const citiesData = fs.readFileSync(citiesPath, 'utf-8');
  cities = JSON.parse(citiesData);
  console.log(`Loaded ${cities.length} cities from database`);
} catch (error) {
  console.error('Error loading cities data:', error);
  process.exit(1);
}

// Utility function for fetch with timeout
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = 10000): Promise<globalThis.Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

// Get a random city from the dataset
function getRandomCity(): City {
  const index = Math.floor(Math.random() * cities.length);
  return cities[index];
}

// Reverse geocode using OpenStreetMap Nominatim
async function reverseGeocode(latitude: number, longitude: number): Promise<{ displayName: string; country: string } | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`;
  
  try {
    const response = await fetchWithTimeout(url, {
      headers: {
        'User-Agent': 'RandomWeatherApp/1.0 (Educational Project)',
      },
    }, 10000);

    if (!response.ok) {
      console.error(`Nominatim returned status ${response.status}`);
      return null;
    }

    const data = await response.json() as NominatimResponse;

    if (data.display_name && data.address?.country) {
      return {
        displayName: data.display_name,
        country: data.address.country,
      };
    }

    return null;
  } catch (error) {
    console.error('Reverse geocode error:', error);
    return null;
  }
}

// Fetch weather data from Open-Meteo
async function fetchWeather(latitude: number, longitude: number): Promise<OpenMeteoResponse | null> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m&hourly=temperature_2m,wind_speed_10m&timezone=auto&forecast_hours=24`;

  try {
    const response = await fetchWithTimeout(url, {}, 10000);

    if (!response.ok) {
      console.error(`Open-Meteo returned status ${response.status}`);
      return null;
    }

    const data = await response.json() as OpenMeteoResponse;
    return data;
  } catch (error) {
    console.error('Weather fetch error:', error);
    return null;
  }
}

// Sleep utility for retry delays
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// API endpoint: GET /api/randomWeather
app.get('/api/randomWeather', async (req: Request, res: Response) => {
  const maxAttempts = 10;
  const retryDelay = 1100; // Slightly over 1 second to respect Nominatim rate limits

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`Attempt ${attempt}/${maxAttempts}: Selecting random city...`);
    
    const city = getRandomCity();
    console.log(`Selected city: ${city.name}, ${city.country} (${city.latitude}, ${city.longitude})`);

    // Reverse geocode the coordinates
    const geoResult = await reverseGeocode(city.latitude, city.longitude);

    if (!geoResult) {
      console.log(`Reverse geocoding failed for ${city.name}, retrying...`);
      if (attempt < maxAttempts) {
        await sleep(retryDelay);
      }
      continue;
    }

    console.log(`Geocoding successful: ${geoResult.displayName}`);

    // Fetch weather data
    const weatherData = await fetchWeather(city.latitude, city.longitude);

    if (!weatherData || !weatherData.current || !weatherData.hourly) {
      console.log(`Weather fetch failed for ${city.name}, retrying...`);
      if (attempt < maxAttempts) {
        await sleep(retryDelay);
      }
      continue;
    }

    // Build hourly forecast (next 24 hours)
    const hourlyForecast = weatherData.hourly.time.slice(0, 24).map((time, index) => ({
      time,
      temperature: weatherData.hourly!.temperature_2m[index],
      windSpeed: weatherData.hourly!.wind_speed_10m[index],
    }));

    // Build response
    const response: WeatherResponse = {
      chosenPlace: {
        displayName: geoResult.displayName,
        country: geoResult.country,
        latitude: city.latitude,
        longitude: city.longitude,
        timezone: weatherData.timezone,
      },
      forecast: {
        current: {
          temperature: weatherData.current.temperature_2m,
          temperatureUnit: '°C',
          windSpeed: weatherData.current.wind_speed_10m,
          windSpeedUnit: 'km/h',
        },
        hourly: hourlyForecast,
      },
      dataSources: {
        geocoding: 'OpenStreetMap Nominatim (https://nominatim.openstreetmap.org)',
        weather: 'Open-Meteo (https://open-meteo.com)',
      },
    };

    console.log(`Successfully fetched weather for ${geoResult.displayName}`);
    return res.json(response);
  }

  // All attempts failed
  console.error('All attempts to get weather data failed');
  return res.status(503).json({
    error: 'Service Unavailable',
    message: 'Unable to resolve a valid location after multiple attempts. The geocoding service may be temporarily unavailable or rate-limited. Please try again in a few moments.',
  });
});

// Serve React app for all other routes (SPA support)
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🌤️  Random Weather Server is running on http://localhost:${PORT}`);
  console.log(`📍 API endpoint: http://localhost:${PORT}/api/randomWeather`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
});
