import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule } from '@ionic/angular'; // Import IonicModule
import { CommonModule } from '@angular/common'; // Import CommonModule for *ngIf
import { Network } from '@capacitor/network';

@Component({
  selector: 'app-offlinemode',
  templateUrl: './offlinemode.page.html',
  styleUrls: ['./offlinemode.page.scss'],
  standalone: true, // Mark as standalone
  imports: [IonicModule, CommonModule], // Add CommonModule
})
export class OfflinemodePage implements OnInit, OnDestroy {
  cachedWeather: any = null;
  cachedForecast: any[] = [];
  offlineStartTime: Date | null = null; // Track when offline mode started
  offlineDuration: number = 0; // Duration in minutes
  private networkListener: any; // Listener for network status changes

  constructor() {}

  async ngOnInit() {
    // Load cached weather and forecast data
    this.loadCachedWeatherData();
    this.loadCachedForecastData();

    // Check initial network status
    const status = await Network.getStatus();
    if (!status.connected) {
      this.enterOfflineMode();
    }

    // Listen for network status changes
    this.networkListener = Network.addListener('networkStatusChange', (status) => {
      if (!status.connected) {
        this.enterOfflineMode();
      } else {
        this.exitOfflineMode();
      }
    });

    // Update offline duration every minute
    setInterval(() => {
      if (this.offlineStartTime) {
        const now = new Date();
        this.offlineDuration = Math.floor((now.getTime() - this.offlineStartTime.getTime()) / 60000); // Calculate minutes
      }
    }, 60000);
  }

  ngOnDestroy() {
    // Remove the network listener when the component is destroyed
    if (this.networkListener) {
      this.networkListener.remove();
    }
  }

  // Load cached weather data from localStorage
  loadCachedWeatherData() {
    const cachedWeather = localStorage.getItem('currentWeather');
    if (cachedWeather) {
      this.cachedWeather = JSON.parse(cachedWeather);
    } else {
      this.cachedWeather = null;
    }

    const cachedHourlyForecast = localStorage.getItem('hourlyForecast');
    if (cachedHourlyForecast) {
      this.cachedForecast = JSON.parse(cachedHourlyForecast);
    } else {
      this.cachedForecast = [];
    }
  }

  // Load cached forecast data from localStorage
  loadCachedForecastData() {
    const cachedForecast = localStorage.getItem('forecastData');
    if (cachedForecast) {
      this.cachedForecast = JSON.parse(cachedForecast);
    } else {
      this.cachedForecast = [];
    }
  }

  enterOfflineMode() {
    if (!this.offlineStartTime) {
      this.offlineStartTime = new Date(); // Record the start time of offline mode
    }
    console.log('Entered offline mode.');
  }

  exitOfflineMode() {
    this.offlineStartTime = null; // Reset offline start time
    this.offlineDuration = 0; // Reset offline duration
    console.log('Exited offline mode.');
  }
}