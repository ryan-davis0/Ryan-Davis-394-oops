import { useState } from 'react';
import { WeatherResponse, ErrorResponse } from './types';
import './App.css';

function App() {
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRandomWeather = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/randomWeather');
      
      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        throw new Error(errorData.message || 'Failed to fetch weather data');
      }

      const data: WeatherResponse = await response.json();
      setWeather(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTemperatureColor = (temp: number): string => {
    if (temp <= 0) return '#60a5fa'; // Cold - blue
    if (temp <= 10) return '#22d3ee'; // Cool - cyan
    if (temp <= 20) return '#4ade80'; // Mild - green
    if (temp <= 30) return '#fbbf24'; // Warm - yellow
    return '#f87171'; // Hot - red
  };

  const getWindDescription = (speed: number): string => {
    if (speed < 5) return 'Calm';
    if (speed < 15) return 'Light breeze';
    if (speed < 30) return 'Moderate wind';
    if (speed < 50) return 'Strong wind';
    return 'Very strong wind';
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">🌍</span>
            <h1>Random Weather</h1>
          </div>
          <p className="tagline">Discover weather from cities around the world</p>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <div className="action-section">
            <button
              className={`fetch-button ${loading ? 'loading' : ''}`}
              onClick={fetchRandomWeather}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Finding a city...
                </>
              ) : (
                <>
                  <span className="button-icon">🎲</span>
                  Get Random Weather
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="error-card fade-in">
              <div className="error-icon">⚠️</div>
              <div className="error-content">
                <h3>Unable to fetch weather</h3>
                <p>{error}</p>
              </div>
            </div>
          )}

          {weather && !loading && (
            <div className="weather-results fade-in">
              {/* Location Card */}
              <div className="location-card">
                <div className="location-header">
                  <span className="location-icon">📍</span>
                  <div className="location-info">
                    <h2 className="location-name">{weather.chosenPlace.displayName}</h2>
                    <p className="location-country">{weather.chosenPlace.country}</p>
                  </div>
                </div>
                <div className="location-details">
                  <div className="detail-item">
                    <span className="detail-label">Coordinates</span>
                    <span className="detail-value">
                      {weather.chosenPlace.latitude.toFixed(4)}°, {weather.chosenPlace.longitude.toFixed(4)}°
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Timezone</span>
                    <span className="detail-value">{weather.chosenPlace.timezone}</span>
                  </div>
                </div>
              </div>

              {/* Current Weather Card */}
              <div className="current-weather-card">
                <h3 className="section-title">Current Weather</h3>
                <div className="current-weather-content">
                  <div className="temperature-display">
                    <span
                      className="temperature-value"
                      style={{ color: getTemperatureColor(weather.forecast.current.temperature) }}
                    >
                      {Math.round(weather.forecast.current.temperature)}
                    </span>
                    <span className="temperature-unit">{weather.forecast.current.temperatureUnit}</span>
                  </div>
                  <div className="wind-display">
                    <span className="wind-icon">💨</span>
                    <div className="wind-info">
                      <span className="wind-value">
                        {weather.forecast.current.windSpeed} {weather.forecast.current.windSpeedUnit}
                      </span>
                      <span className="wind-description">
                        {getWindDescription(weather.forecast.current.windSpeed)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hourly Forecast */}
              <div className="hourly-forecast-card">
                <h3 className="section-title">24-Hour Forecast</h3>
                <div className="hourly-scroll">
                  <table className="hourly-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Date</th>
                        <th>Temp</th>
                        <th>Wind</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weather.forecast.hourly.map((hour, index) => (
                        <tr key={index} className="slide-in" style={{ animationDelay: `${index * 0.02}s` }}>
                          <td className="time-cell">{formatTime(hour.time)}</td>
                          <td className="date-cell">{formatDate(hour.time)}</td>
                          <td className="temp-cell">
                            <span
                              className="temp-badge"
                              style={{ backgroundColor: getTemperatureColor(hour.temperature) + '20', color: getTemperatureColor(hour.temperature) }}
                            >
                              {Math.round(hour.temperature)}°C
                            </span>
                          </td>
                          <td className="wind-cell">{Math.round(hour.windSpeed)} km/h</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Data Sources */}
              <div className="sources-card">
                <h4 className="sources-title">Data Sources</h4>
                <div className="sources-list">
                  <div className="source-item">
                    <span className="source-label">Geocoding:</span>
                    <span className="source-value">{weather.dataSources.geocoding}</span>
                  </div>
                  <div className="source-item">
                    <span className="source-label">Weather:</span>
                    <span className="source-value">{weather.dataSources.weather}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!weather && !loading && !error && (
            <div className="welcome-card fade-in">
              <div className="welcome-icon">🌤️</div>
              <h2>Welcome to Random Weather</h2>
              <p>
                Click the button above to discover the current weather conditions
                in a randomly selected city from around the world.
              </p>
              <div className="features">
                <div className="feature">
                  <span className="feature-icon">🌍</span>
                  <span>200+ cities worldwide</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">🌡️</span>
                  <span>Real-time weather data</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">📊</span>
                  <span>24-hour forecast</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="footer">
        <p>
          Powered by{' '}
          <a href="https://nominatim.openstreetmap.org" target="_blank" rel="noopener noreferrer">
            OpenStreetMap Nominatim
          </a>{' '}
          and{' '}
          <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer">
            Open-Meteo
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
