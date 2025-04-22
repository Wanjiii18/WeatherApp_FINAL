import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms'; 
import { IonicModule } from '@ionic/angular'; 
import { CommonModule } from '@angular/common'; 
import { Router } from '@angular/router'; 

@Component({
  selector: 'app-settings',
  standalone: true,
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  imports: [IonicModule, FormsModule, CommonModule],
})
export class SettingsPage implements OnInit {
  @Output() settingsChanged = new EventEmitter<void>();
  temperatureUnit: string = 'metric'; 
  notificationsEnabled: boolean = false; 
  darkModeEnabled: boolean = false; 

  constructor(private router: Router) {} 

  ngOnInit() {
    
    const savedUnit = localStorage.getItem('temperatureUnit');
    const savedNotifications = localStorage.getItem('notificationsEnabled');
    const savedDarkMode = localStorage.getItem('darkModeEnabled');

    if (savedUnit) {
      this.temperatureUnit = savedUnit;
    }

    if (savedNotifications) {
      this.notificationsEnabled = JSON.parse(savedNotifications); 
    }

    if (savedDarkMode !== null) {
      this.darkModeEnabled = JSON.parse(savedDarkMode); 
      console.log('Dark mode loaded from storage:', this.darkModeEnabled);
    }
  }

  saveTemperatureUnit(unit: string) {
    this.temperatureUnit = unit;
    localStorage.setItem('temperatureUnit', unit);
    this.settingsChanged.emit(); 
  }

  toggleNotifications(enabled: boolean) {
    this.notificationsEnabled = enabled;
    localStorage.setItem('notificationsEnabled', JSON.stringify(enabled)); 
  }
  
  toggleDarkMode(enabled: boolean) {
    this.darkModeEnabled = enabled;
    localStorage.setItem('darkModeEnabled', JSON.stringify(enabled));
    this.applyDarkMode(enabled); 
    this.settingsChanged.emit(); 
  }
  
  applyDarkMode(enabled: boolean) {
    console.log('Applying dark mode:', enabled); 
    if (enabled) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }

  applyChanges() {
    const event = new CustomEvent('settingsChanged', {
      detail: {
        temperatureUnit: this.temperatureUnit,
        darkModeEnabled: this.darkModeEnabled,
      },
    });
    console.log('Dispatching settingsChanged event:', event.detail); 
    document.dispatchEvent(event);

    this.router.navigate(['/home']);
  }
}