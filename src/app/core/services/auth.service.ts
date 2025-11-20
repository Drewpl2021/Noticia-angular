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
}

export interface AuthUser {
  id: number;
  token: string;
  name: string;
  lastName: string;
  role: string;
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
          role: res.role
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

}
