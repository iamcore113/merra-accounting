import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

constructor() { }
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Error saving to local storage', error);
    }
  }
    // Get item from local storage
  getItem(key: string): string | null {
    try {
      const value = localStorage.getItem(key);
      return value ? value : null;
    } catch (error) {
      console.error('Error reading from local storage', error);
      return null;
    }
  }
  // Remove item from local storage
  removeItem(key: string): void {
    localStorage.removeItem(key);
  }
  // Clear all local storage
  clear(): void {
    localStorage.clear();
  }
}
