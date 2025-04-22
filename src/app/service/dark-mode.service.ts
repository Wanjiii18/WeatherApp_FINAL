import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DarkModeService {
  toggleDarkMode(isDark: boolean): void {
    localStorage.setItem('darkMode', isDark.toString());
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }

  isDarkModeEnabled(): boolean {
    return localStorage.getItem('darkMode') === 'true';
  }

  initializeDarkMode(): void {
    const isDark = this.isDarkModeEnabled();
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }
}