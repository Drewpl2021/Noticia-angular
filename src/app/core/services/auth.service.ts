import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  name: string;
  lastName: string;
  id: number;
  role: string;       // "admin", "user", etc.
  plan?: string;

}

export interface AuthUser {
  id: number;
  token: string;
  name: string;
  lastName: string;
  role: string;
  plan?: string;
}
export interface LoggedUser {
  token: string;
  name: string;
  lastName: string;
  role: string; // "admin" | "user" | etc.
}
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private baseUrl = environment.authUrl;
  private _user = signal<LoggedUser | null>(null);

  // Cargamos del localStorage al iniciar
  private initialUser: AuthUser | null = (() => {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  })();

  isLoggedIn = signal<boolean>(!!localStorage.getItem(TOKEN_KEY));
  user = signal<AuthUser | null>(this.initialUser);

  login(req: LoginRequest) {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, req).pipe(
      tap(res => {
        const authUser: AuthUser = {
          id: res.id,
          token: res.token,
          name: res.name,
          lastName: res.lastName,
          role: res.role,
          plan: res.plan
        };

        // Guardamos token y usuario
        localStorage.setItem(TOKEN_KEY, authUser.token);
        localStorage.setItem(USER_KEY, JSON.stringify(authUser));

        this.isLoggedIn.set(true);
        this.user.set(authUser);

      })
    );
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.isLoggedIn.set(false);
    this.user.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  hasRole(role: string): boolean {
    const u = this.user();
    if (!u) return false;
    return u.role === role;   // usa EXACTAMENTE lo que trae el backend
  }

  isAdmin(): boolean {
    return this.hasRole('admin');  // porque backend manda "admin"
  }


  // =============================
  // Helpers por PLAN de suscripción
  // =============================
  private normalizePlan(plan: string): string {
    // normaliza: quita tildes, pasa a minúsculas, recorta espacios
    return plan
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // quita acentos
      .toLowerCase()
      .trim();
  }

  hasPlan(plan: string): boolean {
    const u = this.user();
    if (!u || !u.plan) return false;
    return this.normalizePlan(u.plan) === this.normalizePlan(plan);
  }

  isPremiumMensual(): boolean {
    return this.hasPlan('Premium Mensual');
  }

  isPremiumAnual(): boolean {
    return this.hasPlan('Premium Anual');
  }

  isClasicoMensual(): boolean {
    return this.hasPlan('Clásico Mensual');
  }

  isPlanFree(): boolean {
    return this.hasPlan('Plan Free');
  }
  getCurrentPlan(): string | null {
    const u = this.user();
    return u?.plan ?? null;
  }

}
