import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'detalle/:id',
    loadComponent: () =>
      import('./pages/detail/detail.component').then(m => m.DetailComponent)
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then(m => m.LoginComponent)
    // aquí podríamos poner un guard para que si ya está logueado no entre,
    // pero por ahora lo dejamos libre.
  },

  // ====== RUTAS PROTEGIDAS (login + admin) ======
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./pages/admin/admin.component').then(m => m.AdminComponent)
  },
  {
    path: 'rol',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./pages/admin/users/users.component').then(m => m.UsersComponent)
  },
  {
    path: 'scrapper',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./pages/admin/scrapper/scrapper.component').then(m => m.ScrapperComponent)
  },

  { path: '**', redirectTo: '' },
];
