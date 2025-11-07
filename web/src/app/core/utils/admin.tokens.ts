import { InjectionToken } from '@angular/core';

export type TokenTypConfig = {
  accessToken: string;
};

export const TOKEN_CONFIG = new InjectionToken<TokenTypConfig>('Token Config');
