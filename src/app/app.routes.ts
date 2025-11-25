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

  {
    path: 'noticiasp',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/noticias/Premiun/noticiasP.component').then(m => m.NoticiasPComponent)
  },
  {
    path: 'noticiasc',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/noticias/Clasico/noticiasC.component').then(m => m.NoticiasCComponent)
  },
  {
    path: 'noticiasf',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/noticias/free/noticiasF.component').then(m => m.NoticiasFComponent)
  },
  {
    path: 'etl',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/etl/etl-articulos.component').then(m => m.EtlArticulosComponent)
  },
  {
    path: 'datamart',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/datamart/datamart-builder.component').then(m => m.DatamartBuilderComponent)
  },
  {
    path: 'csvp',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/csv/Premiun/csvP.component').then(m => m.CsvPComponent)
  },
  {
    path: 'csvc',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/csv/clasico/csvC.component').then(m => m.CsvCComponent)
  },
  {
    path: 'crearNoticia',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/solicitudesP/solicitudes-noticias.component').then(m => m.SolicitudesNoticiasComponent)
  },
  {
    path: 'aprobar',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./pages/solicitudesP/admin/solicitudes.component').then(m => m.SolicitudesAdminComponent)
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
  {
    path: 'suscripcion/:productoId',
    loadComponent: () =>
      import('./pages/admin/suscripcion/tresPasos/tres-pasos.component').then(m => m.TresPasosComponent)
  },
  { path: '**', redirectTo: '' },
];
