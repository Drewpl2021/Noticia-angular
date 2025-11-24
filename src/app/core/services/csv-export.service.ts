import {inject, Injectable} from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import {environment} from "../../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class CsvExportService extends ApiService {

  // 1. Exportar todo
  exportAll(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/articulos/export-csv`, {
      responseType: 'blob'
    });
  }

  // 2. Exportar por categorías (array -> "Deportes,Politica")
  exportByCategories(categorias: string[]): Observable<Blob> {
    const categoria = categorias.join(',');
    const params = new HttpParams().set('categoria', categoria);

    return this.http.get(`${this.baseUrl}/articulos/export-csv-por-categoria`, {
      params,
      responseType: 'blob'
    });
  }

  // 3. Exportar por fechas
  exportByDates(desde: string, hasta: string): Observable<Blob> {
    const params = new HttpParams()
      .set('desde', desde)
      .set('hasta', hasta);

    return this.http.get(`${this.baseUrl}/articulos/export-csv-fecha`, {
      params,
      responseType: 'blob'
    });
  }

  // 4. Exportar por categoría + fecha
  exportByFilters(categoria: string, desde: string, hasta: string): Observable<Blob> {
    const params = new HttpParams()
      .set('categoria', categoria)
      .set('desde', desde)
      .set('hasta', hasta);

    return this.http.get(`${this.baseUrl}/articulos/export-csv-filtros`, {
      params,
      responseType: 'blob'
    });
  }
}
