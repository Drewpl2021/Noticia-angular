import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (_route, state): boolean | UrlTree => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // si está logueado, ok
  if (auth.isLoggedIn()) {
    return true;
  }

  // si NO está logueado, lo mandamos a /login con redirect
  return router.createUrlTree(
    ['/login'],
    { queryParams: { redirectTo: state.url } }
  );
};
