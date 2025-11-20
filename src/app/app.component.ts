import {Component, signal} from '@angular/core';
import {Router, RouterLink, RouterOutlet} from '@angular/router';
import { ThemeService } from './core/services/theme.service';
import {AuthService} from "./core/services/auth.service";
import {CommonModule} from "@angular/common";
import {Producto} from "./core/models/producto.model";
import {ProductoService} from "./core/services/producto.service";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,RouterLink,CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Noticias';

  constructor(
    private theme: ThemeService,
    private router: Router,
    public  auth: AuthService,
    private productoApi: ProductoService,
) {}

  isLoggedIn = this.auth.isLoggedIn;
  user       = this.auth.user;
  showUserMenu = signal(false);

  toggleTheme() { this.theme.toggle(); }

  get themeLabel() {
    return this.theme.current() === 'light' ? '🌙 Oscuro' : '☀️ Claro';
  }
  goLogin() {
    this.router.navigate(['/login']);
  }

  goProfile() {
    this.showUserMenu.set(false);
    this.router.navigate(['/perfil']); // ajusta si usas otra ruta
  }

  logout() {
    this.auth.logout();
    this.showUserMenu.set(false);
    this.router.navigate(['/']);
  }

  toggleUserMenu() {
    this.showUserMenu.set(!this.showUserMenu());
  }
  isAdmin() {
    return this.auth.isAdmin();
  }












  isMensual(plan: Producto): boolean {
    return (plan.nombre ?? '').toLowerCase().includes('mensual');

  }
  // app.component.ts
  seleccionarPlan(plan: Producto) {
    // cerrar modal si quieres
    this.showPlanes.set(false);

    // ir a la ruta de suscripción con el id del producto
    this.router.navigate(['/suscripcion', plan.id]);
  }






  planes = signal<Producto[]>([]);
  planesLoading = signal(false);
  planesError = signal<string | null>(null);
  showPlanes = signal(false);

  // 🔹 abre el modal de planes
  openPlanes() {
    this.showPlanes.set(true);

    // si ya los tengo cargados, no vuelvo a llamar al backend
    if (this.planes().length > 0) return;

    this.planesLoading.set(true);
    this.planesError.set(null);

    this.productoApi.listar().subscribe({
      next: (data) => {
        // opcional: filtrar sólo productos de tipo SUSCRIPCION y activos
        const activos = data.filter(p => p.tipo === 'SUSCRIPCION' && p.estado === 'ACTIVO');
        this.planes.set(activos);
        this.planesLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando planes', err);
        this.planesError.set('No se pudieron cargar los planes.');
        this.planesLoading.set(false);
      }
    });
  }

  // 🔹 cerrar modal
  closePlanes() {
    this.showPlanes.set(false);
  }

}
