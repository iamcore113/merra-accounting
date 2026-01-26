// auth-context.ts
import { HttpContextToken } from '@angular/common/http';

// Create a token with a default value of false (meaning auth is NOT bypassed by default)
export const BYPASS_LOGGING = new HttpContextToken<boolean>(() => false);