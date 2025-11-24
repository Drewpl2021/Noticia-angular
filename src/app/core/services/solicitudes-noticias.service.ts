import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface SolicitudNoticiaRequest {
  url: string;
  titulo: string;
  autor: string;
  fechaPublicado: string;
  imagenUrl: string;
  contenido: string;
  tags: string;
  categorias: string;
  usuarioId: number;
}

export interface SolicitudNoticia extends SolicitudNoticiaRequest {
  id: number;
  estado?: string;
  creadoEn?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SolicitudesNoticiasService extends ApiService {

  // 🔹 Crear solicitud (usuario)
  crearSolicitud(body: SolicitudNoticiaRequest): Observable<SolicitudNoticia> {
    return this.http.post<SolicitudNoticia>(
      `${this.baseUrl}/solicitudes-noticias`,
      body
    );
  }
// 🔹 Ver TODAS las solicitudes (admin) con estado opcional
  listarTodas(estado?: string): Observable<SolicitudNoticia[]> {
    let params = new HttpParams();
    if (estado) {
      params = params.set('estado', estado);
    }
    return this.http.get<SolicitudNoticia[]>(
      `${this.baseUrl}/solicitudes-noticias`,
      { params }
    );
  }

  // 🔹 Ver mis solicitudes (usuario) ya lo tenías
  listarMias(usuarioId: number, estado?: string): Observable<SolicitudNoticia[]> {
    let params = new HttpParams().set('usuarioId', usuarioId);
    if (estado) {
      params = params.set('estado', estado);
    }
    return this.http.get<SolicitudNoticia[]>(
      `${this.baseUrl}/solicitudes-noticias/mias`,
      { params }
    );
  }

  // 🔹 Buscar por ID
  obtenerPorId(id: number): Observable<SolicitudNoticia> {
    return this.http.get<SolicitudNoticia>(
      `${this.baseUrl}/solicitudes-noticias/${id}`
    );
  }

  // 🔹 Aprobar
  aprobar(id: number): Observable<SolicitudNoticia> {
    return this.http.post<SolicitudNoticia>(
      `${this.baseUrl}/solicitudes-noticias/${id}/aprobar`,
      {}
    );
  }

  // 🔹 Rechazar
  rechazar(id: number): Observable<SolicitudNoticia> {
    return this.http.post<SolicitudNoticia>(
      `${this.baseUrl}/solicitudes-noticias/${id}/rechazar`,
      {}
    );
  }
}
