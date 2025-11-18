import {ApplicationConfig, LOCALE_ID, provideZoneChangeDetection} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {authInterceptor} from "./core/interceptors/auth.interceptor";
import {ThemeService} from "./core/services/theme.service";

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient( withInterceptors([authInterceptor])),
    { provide: LOCALE_ID, useValue: 'es' },  // 👈 fuerza español para DatePipe, etc.
    ThemeService

  ]
};
