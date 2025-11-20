// src/app/core/services/producto.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Producto } from '../models/producto.model';
import {environment} from "../../../environments/environment";

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/productos`;

  listar(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.baseUrl);
  }
  obtener(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.baseUrl}/${id}`);
  }
}
