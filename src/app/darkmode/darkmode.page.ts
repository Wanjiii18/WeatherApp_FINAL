import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms'; // Import FormsModule for ngModel
import { DarkModeService } from '../service/dark-mode.service'; // Import the service

@Component({
  selector: 'app-darkmode',
  templateUrl: './darkmode.page.html',
  styleUrls: ['./darkmode.page.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule], // Add FormsModule
})
export class DarkmodePage implements OnInit {
  darkModeEnabled: boolean = false;

  constructor(private darkModeService: DarkModeService) {} // Inject the service

  ngOnInit() {
    // Load the saved dark mode preference
    this.darkModeEnabled = this.darkModeService.isDarkModeEnabled();
    this.darkModeService.toggleDarkMode(this.darkModeEnabled);
  }

  toggleDarkMode() {
    this.darkModeEnabled = !this.darkModeEnabled;
    this.darkModeService.toggleDarkMode(this.darkModeEnabled); // Apply dark mode
    if (this.darkModeEnabled) {
      document.body.classList.add('dark'); // Add dark mode class
    } else {
      document.body.classList.remove('dark'); // Remove dark mode class
    }
  }
}