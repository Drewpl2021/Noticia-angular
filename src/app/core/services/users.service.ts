import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserRole {
  id: number;
  nombre: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  lastName: string;
  name: string;
  rol?: UserRole | null;   // ajusta a "role" si tu backend lo manda así
}

// DTO para crear/actualizar
export interface SaveUserRequest {
  username: string;
  email: string;
  name: string;
  lastName: string;
  roleId: number;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);

  // 👇 Ajusta '/usuarios' si tu endpoint real es otro
  private baseUrl = `${environment.apiUrl}/usuarios`;

  list(): Observable<User[]> {
    return this.http.get<User[]>(this.baseUrl);
  }

  byId(id: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/${id}`);
  }

  create(payload: SaveUserRequest): Observable<User> {
    return this.http.post<User>(this.baseUrl, payload);
  }

  update(id: number, payload: SaveUserRequest): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
