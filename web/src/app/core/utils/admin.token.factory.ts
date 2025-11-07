import { LocalStorageService } from "../services/localStorage/localStorage.service";

/**
 * Factory function to create the TOKEN_CONFIG value dynamically.
 * @param localStorageService The injected instance of the service.
 * @returns The final object structure for TOKEN_CONFIG.
 */
export function tokenConfigFactory(localStorageService: LocalStorageService): { accessToken: string } {
  // Use the key you use to store the token in local storage
  const accessToken = localStorageService.getItem('access_token');

  return {
    // Return the configuration object with the dynamic token value
    accessToken: accessToken || '',
  };
}
