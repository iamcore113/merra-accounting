import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { definePreset } from '@primeng/themes';
import { DialogService } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';

import { routes } from './app.routes';
import { authInterceptor } from './shared/interceptors/auth-interceptor';
import { initInterceptor } from './shared/interceptors/init-interceptor';

const MerraPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#f4f8f1',
      100: '#e6f1df',
      200: '#cfe4c3',
      300: '#b0d39e',
      400: '#8ebe73',
      500: '#689d4b',
      600: '#528139',
      700: '#41662f',
      800: '#365228',
      900: '#2e4524',
      950: '#16270e',
    },
    focusRing: {
      width: '1px',
      style: 'solid',
      color: '{primary.500}',
      offset: '0px',
    },
    colorScheme: {
      light: {
        primary: {
          color: '{primary.500}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.600}',
          activeColor: '{primary.700}',
        },
        highlight: {
          background: '{primary.50}',
          focusBackground: '{primary.100}',
          color: '{primary.700}',
          focusColor: '{primary.800}',
        },
      },
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch(), withInterceptors([initInterceptor, authInterceptor])),
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideAnimationsAsync(),
    provideRouter(routes, withViewTransitions()),
    providePrimeNG({
      theme: {
        preset: MerraPreset,
        options: {
          darkModeSelector: false,
        },
      },
      ripple: true,
    }),
    DialogService,
    MessageService,
  ],
};
