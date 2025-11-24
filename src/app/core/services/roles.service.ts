// src/app/core/services/roles.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment'; // 👈 ajusta la ruta si es distinta
import { ApiService } from './api.service';

export interface Role {
  id: number;
  nombre: string;
  descripcion: string;
}

export interface CreateRoleRequest {
  nombre: string;
  descripcion: string;
}

export interface UpdateRoleRequest {
  nombre: string;
  descripcion: string;
}

@Injectable({ providedIn: 'root' })
export class RolesService {
  private http = inject(HttpClient);

  // 👇 usamos tu apiUrl ya configurado
  private baseUrl = `${environment.apiUrl}/roles`;

  list(): Observable<Role[]> {
    return this.http.get<Role[]>(this.baseUrl);
  }

  getById(id: number): Observable<Role> {
    return this.http.get<Role>(`${this.baseUrl}/${id}`);
  }

  create(payload: CreateRoleRequest): Observable<Role> {
    return this.http.post<Role>(this.baseUrl, payload);
  }

  update(id: number, payload: UpdateRoleRequest): Observable<Role> {
    return this.http.put<Role>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
