import {Component, signal} from '@angular/core';
import {Router, RouterLink, RouterOutlet} from '@angular/router';
import { ThemeService } from './core/services/theme.service';
import {AuthService} from "./core/services/auth.service";
import {CommonModule} from "@angular/common";

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
    public  auth: AuthService
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
}
