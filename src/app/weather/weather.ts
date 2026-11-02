import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface GeoResponse {
  results?: { name: string; country: string; latitude: number; longitude: number }[];
}

interface ForecastResponse {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    weather_code: number;
  };
}

@Component({
  selector: 'app-weather',
  imports: [FormsModule],
  templateUrl: './weather.html',
  styleUrl: './weather.css'
})
export class Weather {
  private http = inject(HttpClient);

  city = '';
  loading = signal(false);
  error = signal('');
  place = signal('');
  temp = signal<number | null>(null);
  humidity = signal<number | null>(null);
  wind = signal<number | null>(null);
  condition = signal('');

  showWeather() {
    const name = this.city.trim();
    if (!name) {
      this.error.set('Please enter a city name.');
      this.temp.set(null);
      return;
    }

    this.error.set('');
    this.temp.set(null);
    this.loading.set(true);

    // Call 1: city name -> coordinates
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1`;

    this.http.get<GeoResponse>(geoUrl).subscribe({
      next: (geo) => {
        const found = geo.results?.[0];
        if (!found) {
          this.loading.set(false);
          this.error.set(`City "${name}" not found.`);
          return;
        }
        this.place.set(`${found.name}, ${found.country}`);
        this.getForecast(found.latitude, found.longitude);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Network error. Check your internet connection.');
      }
    });
  }

  // Call 2: coordinates -> current weather
  private getForecast(lat: number, lon: number) {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`;

    this.http.get<ForecastResponse>(url).subscribe({
      next: (data) => {
        this.temp.set(data.current.temperature_2m);
        this.humidity.set(data.current.relative_humidity_2m);
        this.wind.set(data.current.wind_speed_10m);
        this.condition.set(this.describe(data.current.weather_code));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Could not fetch weather data.');
      }
    });
  }

  private describe(code: number): string {
    if (code === 0) return 'Clear sky';
    if (code <= 3) return 'Partly cloudy';
    if (code <= 48) return 'Fog';
    if (code <= 57) return 'Drizzle';
    if (code <= 67) return 'Rain';
    if (code <= 77) return 'Snow';
    if (code <= 82) return 'Rain showers';
    if (code <= 86) return 'Snow showers';
    return 'Thunderstorm';
  }
}