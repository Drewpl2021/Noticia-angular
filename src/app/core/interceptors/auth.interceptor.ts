// src/app/core/interceptors/auth.interceptor.ts
import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  // ⛔ No tocar peticiones a Culqi
  if (req.url.startsWith('https://api.culqi.com')) {
    return next(req);
  }

  // ✅ Solo agregar el JWT a tus APIs (backend)
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req);
};
