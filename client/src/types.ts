export interface HourlyForecast {
  time: string;
  temperature: number;
  windSpeed: number;
}

export interface WeatherResponse {
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
    hourly: HourlyForecast[];
  };
  dataSources: {
    geocoding: string;
    weather: string;
  };
}

export interface ErrorResponse {
  error: string;
  message: string;
}
