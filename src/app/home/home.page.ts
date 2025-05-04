import { Component, OnInit } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { DarkModeService } from '../service/dark-mode.service';
import { AlertController, Platform } from '@ionic/angular';
import { Network } from '@capacitor/network'; 

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  latitude: number | null = null;
  longitude: number | null = null;
  locationName: string = 'Fetching location...';
  temperature: number | null = null;
  weatherDescription: string = '';
  humidity: number | null = null;
  windSpeed: number | null = null;
  weatherIcon: string = '';
  chanceOfRain: string = 'No rain data available';
  errorMessage: string | null = null;
  cityName: string = '';
  forecast: any[] = [];
  hourlyForecast: any[] = [];
  todayWeather: any = null;
  temperatureUnit: string = 'metric';
  darkModeEnabled: boolean = false;
  currentTime: string = '';
  isOffline: boolean = false;
  offlineStartTime: number | null = null;
  offlineDuration: string = '';
  flagUrl: string = ''; 

  currentDate: string = '';
  private apiKey = environment.apiKey;
  private isInitialized = false; // Track if the page has already been initialized

  handleOffline = () => {
    this.isOffline = true;
    this.offlineStartTime = Date.now(); // Record the offline start time
    this.updateOfflineDuration(); // Start updating offline duration
    console.log('You are offline.');
  };

  // Handle online event
  handleOnline = () => {
    this.isOffline = false;
    this.offlineStartTime = null; // Reset offline start time
    this.offlineDuration = ''; // Clear offline duration
    console.log('You are back online.');
  };

  // Update offline duration dynamically
  updateOfflineDuration() {
    if (this.isOffline && this.offlineStartTime) {
      const now = Date.now();
      const diff = now - this.offlineStartTime;

      // Calculate minutes and hours
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);

      if (hours > 0) {
        this.offlineDuration = `${hours} hour(s) and ${minutes % 60} minute(s) offline`;
      } else {
        this.offlineDuration = `${minutes} minute(s) offline`;
      }

      // Update the duration every minute
      setTimeout(() => this.updateOfflineDuration(), 60000);
    }
  }
  constructor(
    private http: HttpClient,
    private alertController: AlertController, // Inject AlertController
    private darkModeService: DarkModeService,
    private platform: Platform // Inject Platform
  ) {}
  

  async ngOnInit() {
    if (this.isInitialized) {
      return; // Prevent re-initialization when navigating back from settings
    }
    this.isInitialized = true;
    this.darkModeService.initializeDarkMode();
    

    this.isOffline = !navigator.onLine;
    if (this.isOffline) {
      this.offlineStartTime = Date.now(); // Record the offline start time
      this.updateOfflineDuration(); // Start updating offline duration
    }
  
    // Add event listeners for online/offline events
    window.addEventListener('offline', this.handleOffline);
    window.addEventListener('online', this.handleOnline);
    

    this.updateCurrentTime();
    setInterval(() => {
      this.updateCurrentTime();
    }, 1000);

    // Load saved temperature unit
    const savedUnit = localStorage.getItem('temperatureUnit');
    if (savedUnit) {
      this.temperatureUnit = savedUnit;
    }

    // Set current date
    this.currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Check internet connectivity
    const status = await Network.getStatus();
    if (!status.connected) {
      console.log('No internet connection. Switching to offline mode.');
      this.loadOfflineWeatherData();
    } else {
      console.log('Internet connection available. Requesting location permission...');
      await this.requestLocationPermission();
    }

    // Listen for changes in settings
    document.addEventListener('settingsChanged', (event: any) => {
      console.log('Received settingsChanged event:', event.detail); // Debugging: Log the event details
      this.refreshSettings(event.detail);
    });
  }

  async requestLocationPermission() {
    console.log('Checking platform for location permission...');
    if (this.platform.is('capacitor')) {
      console.log('Running on Capacitor platform. Requesting location permission...');
      const alert = await this.alertController.create({
        header: 'Location Access Required',
        message: 'This app needs access to your location to provide weather updates.',
        buttons: [
          {
            text: 'Deny',
            role: 'cancel',
            handler: () => {
              console.log('User denied location access');
              this.errorMessage = 'Location access denied. Please enable location services.';
            },
          },
          {
            text: 'Allow Once',
            handler: async () => {
              console.log('User allowed location access once');
              try {
                await this.getCurrentLocation(); // Get location once
              } catch (error) {
                console.error('Error getting location:', error);
                this.errorMessage = 'Failed to get location. Please enable GPS.';
              }
            },
          },
          {
            text: 'Allow When Using the App',
            handler: async () => {
              console.log('User allowed location access when using the app');
              try {
                localStorage.setItem('locationPermission', 'granted'); // Save preference
                await this.getCurrentLocation(); // Get location
              } catch (error) {
                console.error('Error getting location:', error);
                this.errorMessage = 'Failed to get location. Please enable GPS.';
              }
            },
          },
        ],
      });
  
      await alert.present();
    } else {
      console.log('Running in a browser. Falling back to navigator.geolocation...');
      this.getBrowserLocation();
    }
  }
  async getCurrentLocation() {
    try {
      // Request location permissions
      const permission = await Geolocation.requestPermissions();
      console.log('Location Permission:', permission);
  
      if (permission.location === 'granted') {
        // If permission is granted, get the current position
        const coordinates = await Geolocation.getCurrentPosition();
        console.log('Coordinates:', coordinates);
  
        this.latitude = coordinates.coords.latitude;
        this.longitude = coordinates.coords.longitude;
  
        // Fetch weather data based on the current location
        this.getWeatherDataByCoords(this.latitude, this.longitude);
        this.get5DayForecastByCoords(this.latitude, this.longitude);
      } else {
        // If permission is denied, show an error message
        this.errorMessage = 'Location permission denied. Please enable location services.';
        console.error('Location permission denied.');
        this.loadOfflineWeatherData(); // Load offline data if location permission is denied
      }
    } catch (error) {
      // Handle errors (e.g., user denies permission or location services are disabled)
      this.errorMessage = 'Failed to get location. Please enable GPS.';
      console.error('Geolocation Error:', error);
      this.locationName = 'Unknown Location';
      this.loadOfflineWeatherData(); // Load offline data on error
    }
  }
  
  getBrowserLocation() {
    if ('geolocation' in navigator) {
      console.log('Browser supports geolocation. Requesting location...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Browser Geolocation Success:', position);
          this.latitude = position.coords.latitude;
          this.longitude = position.coords.longitude;
          this.getWeatherDataByCoords(this.latitude, this.longitude);
          this.get5DayForecastByCoords(this.latitude, this.longitude);
        },
        (error) => {
          console.error('Browser Geolocation Error:', error);
          switch (error.code) {
            case error.PERMISSION_DENIED:
              this.errorMessage = 'Location access denied by the user.';
              break;
            case error.POSITION_UNAVAILABLE:
              this.errorMessage = 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              this.errorMessage = 'The request to get user location timed out.';
              break;
            default:
              this.errorMessage = 'An unknown error occurred while fetching location.';
          }
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
      this.errorMessage = 'Geolocation is not supported by your browser.';
    }
  }

  getWeatherDataByCoords(lat: number, lon: number) {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=${this.temperatureUnit}`;

    this.http.get<any>(url).subscribe(
      (data) => {
        this.errorMessage = null;
        this.updateWeatherData(data);
      },
      (error) => {
        console.error('Error fetching weather data:', error);
        this.locationName = 'Unknown Location';
        this.errorMessage = 'Failed to fetch weather data. Switching to offline mode.';
        this.loadOfflineWeatherData(); // Load offline data on error
      }
    );
  }

  getWeatherDataByCity(city: string) {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${this.apiKey}&units=${this.temperatureUnit}`;

    this.http.get<any>(url).subscribe(
      (data) => {
        this.errorMessage = null;
        this.updateWeatherData(data);
        this.get5DayForecastByCity(city);
      },
      (error) => {
        console.error('Error fetching weather data:', error);
        this.locationName = 'Unknown Location';
        this.errorMessage = 'Failed to fetch weather data';
      }
    );
  }

  get5DayForecastByCoords(lat: number, lon: number) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=${this.temperatureUnit}`;
  
    this.http.get<any>(url).subscribe(
      (data) => {
        console.log('5-Day Forecast API Response:', data); // Debugging: Log the API response
        this.errorMessage = null;
        this.forecast = this.processForecastData(data.list);
        this.hourlyForecast = this.getHourlyForecast(data.list); // Extract hourly updates for today

        // Save the forecast and hourly forecast data to localStorage
        localStorage.setItem('forecastData', JSON.stringify(this.forecast));
        localStorage.setItem('hourlyForecast', JSON.stringify(this.hourlyForecast));
      },
      (error) => {
        console.error('Error fetching 5-day forecast:', error);
        this.errorMessage = 'Failed to fetch 5-day forecast. Switching to offline mode.';
      }
    );
  }

  get5DayForecastByCity(city: string) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${this.apiKey}&units=${this.temperatureUnit}`;

    this.http.get<any>(url).subscribe(
      (data) => {
        this.errorMessage = null;
        this.forecast = this.processForecastData(data.list);
      },
      (error) => {
        console.error('Error fetching 5-day forecast:', error);
        this.errorMessage = 'Failed to fetch 5-day forecast';
      }
    );
  }

  processForecastData(data: any[]): any[] {
    if (!data || data.length === 0) {
      return [];
    }
  
    const now = new Date();
    const today = now.toISOString().split('T')[0];
  
    // Filter out the current day and start from the next day
    const filteredData = data.filter((item) => {
      const forecastDate = item.dt_txt.split(' ')[0];
      return forecastDate > today; // Include only dates after today
    });
  
    // Limit the forecast to 5 days
    const uniqueDays = new Set();
    const fiveDayForecast = filteredData.filter((item) => {
      const day = new Date(item.dt_txt).toLocaleDateString('en-US', { weekday: 'long' });
      if (!uniqueDays.has(day)) {
        uniqueDays.add(day);
        return true;
      }
      return false;
    });
  
    // Map the filtered data to the desired format
    return fiveDayForecast.slice(0, 5).map((item) => ({
      day: new Date(item.dt_txt).toLocaleDateString('en-US', { weekday: 'long' }),
      main: item.main,
      weather: item.weather,
      wind: item.wind,
      rain: item.rain,
    }));
  }

  updateWeatherData(data: any) {
    this.locationName = data.name || 'Unknown Location';
    this.temperature = data.main?.temp || null;
    this.weatherDescription = data.weather?.[0]?.description || '';
    this.humidity = data.main?.humidity || null;
    this.windSpeed = data.wind?.speed || null;
    this.weatherIcon = data.weather?.[0]?.icon
      ? `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`
      : '';
  
    if (data.rain && data.rain['1h']) {
      this.chanceOfRain = `${data.rain['1h']} mm in the last hour`;
    } else {
      this.chanceOfRain = 'No rain data available';
    }
  
    // Fetch the   using the country code
    if (data.sys?.country) {
      const countryCode = data.sys.country;
      this.fetchFlag(countryCode);
    }
  
    // Debugging: Log the updated weather data
    console.log('Updated weather data:', {
      locationName: this.locationName,
      temperature: this.temperature,
      weatherDescription: this.weatherDescription,
      humidity: this.humidity,
      windSpeed: this.windSpeed,
      weatherIcon: this.weatherIcon,
      chanceOfRain: this.chanceOfRain,
    });
  
    // Save the current weather data to localStorage
    localStorage.setItem('currentWeather', JSON.stringify(data));
  }
  changeTemperatureUnit(unit: string) {
    this.temperatureUnit = unit;
    localStorage.setItem('temperatureUnit', unit);

    if (this.latitude && this.longitude) {
      this.getWeatherDataByCoords(this.latitude, this.longitude);
      this.get5DayForecastByCoords(this.latitude, this.longitude);
    } else if (this.cityName) {
      this.getWeatherDataByCity(this.cityName);
    }
  }

getHourlyForecast(data: any[]): any[] {
  if (!data || data.length === 0) {
    console.warn('No hourly forecast data available.');
    return [];
  }

  const now = new Date(); // Get the current time
  const today = now.toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

  const hourlyData = data
    .filter((item) => {
      const itemDate = new Date(item.dt_txt);
      return item.dt_txt.startsWith(today) && itemDate >= now; // Include only future hours
    })
    .map((item) => ({
      time: new Date(item.dt_txt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      temp: item.main.temp,
      condition: item.weather[0].description,
      icon: `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`,
    }));

  console.log('Filtered Hourly Forecast:', hourlyData); // Debugging: Log the filtered hourly forecast
  return hourlyData;
}

  getTemperatureClass(temp: number): string {
    if (temp <= 0) {
      return 'temperature-low';
    } else if (temp > 0 && temp <= 10) {
      return 'temperature-cool';
    } else if (temp > 10 && temp <= 20) {
      return 'temperature-mild';
    } else if (temp > 20 && temp <= 30) {
      return 'temperature-warm';
    } else if (temp > 30 && temp <= 40) {
      return 'temperature-hot';
    } else {
      return 'temperature-very-hot';
    }
  }
  //new

  loadOfflineWeatherData() {
    const savedWeather = localStorage.getItem('currentWeather');
    const savedForecast = localStorage.getItem('forecastData');
    const savedHourlyForecast = localStorage.getItem('hourlyForecast');
  
    if (savedWeather) {
      const weatherData = JSON.parse(savedWeather);
      console.log('Offline mode: Displaying last saved current weather data.', weatherData);
      this.updateWeatherData(weatherData);
    } else {
      this.errorMessage = 'No cached current weather data available.';
    }
  
    if (savedForecast) {
      this.forecast = JSON.parse(savedForecast);
      console.log('Offline mode: Displaying last saved 5-day forecast.', this.forecast);
    } else {
      console.log('No cached 5-day forecast data available.');
    }
  
    if (savedHourlyForecast) {
      this.hourlyForecast = JSON.parse(savedHourlyForecast);
      console.log('Offline mode: Displaying last saved hourly forecast.', this.hourlyForecast);
    } else {
      console.log('No cached hourly forecast data available.');
    }
  }

  refreshSettings(settings: { temperatureUnit: string; darkModeEnabled: boolean }) {
    // Apply dark mode using the service
    this.darkModeService.toggleDarkMode(settings.darkModeEnabled);

    // Refresh weather data if temperature unit changes
    if (settings.temperatureUnit && settings.temperatureUnit !== this.temperatureUnit) {
      this.temperatureUnit = settings.temperatureUnit;
      if (this.latitude && this.longitude) {
        this.getWeatherDataByCoords(this.latitude, this.longitude);
        this.get5DayForecastByCoords(this.latitude, this.longitude);
      } else if (this.cityName) {
        this.getWeatherDataByCity(this.cityName);
      }
    }
  }
  fetchFlag(countryCode: string) {
    const url = `https://restcountries.com/v3.1/alpha/${countryCode}`;
    this.http.get<any>(url).subscribe(
      (data) => {
        if (data && data[0]?.flags?.png) {
          this.flagUrl = data[0].flags.png; // Set the flag URL
          console.log('Flag URL:', this.flagUrl); // Debugging
        }
      },
      (error) => {
        console.error('Error fetching flag:', error);
        this.flagUrl = ''; // Clear the flag URL on error
      }
    );
  }
  
  updateCurrentTime() {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }
}
