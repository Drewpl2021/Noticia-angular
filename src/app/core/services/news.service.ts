import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import {NewsPage, NewsItem, ArticuloImportResult} from '../models/news.model';

@Injectable({
  providedIn: 'root'
})
export class NewsService extends ApiService {

  list(params: { page: number; size: number; categoria?: string }): Observable<NewsPage> {
    return this.http.get<NewsPage>(`${this.baseUrl}/articulos`, {
      params: {
        page: params.page,
        size: params.size,
        ...(params.categoria ? { categoria: params.categoria } : {})
      }
    });
  }

  byId(id: number): Observable<NewsItem> {
    return this.http.get<NewsItem>(`${this.baseUrl}/articulos/${id}`);
  }

  categories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/articulos/categorias`);
  }

  trending(): Observable<NewsItem[]> {
    return this.http.get<NewsItem[]>(`${this.baseUrl}/articulos/trending`);
  }

  subscribe(email: string) {
    return this.http.post(`${this.baseUrl}/articulos/newsletter`, { email });
  }


  // ================== NUEVAS APIS ==================

  /**
   * ✅ Buscar por texto (incluye título)
   * GET /api/articulos/search?q=...
   */
  search(q: string, page: number, size: number): Observable<NewsPage> {
    return this.http.get<NewsPage>(`${this.baseUrl}/articulos/search`, {
      params: {
        q,
        page,
        size
      }
    });
  }

  /**
   * ✅ Buscar por una categoría
   * GET /api/articulos/categoria?c=...
   * (Si algún día quieres reemplazar list(...) por esto, ya está listo)
   */
  byCategory(categoria: string, page: number, size: number): Observable<NewsPage> {
    return this.http.get<NewsPage>(`${this.baseUrl}/articulos/categoria`, {
      params: {
        c: categoria,
        page,
        size
      }
    });
  }

  /**
   * ✅ Filtrar por varias categorías
   * GET /api/articulos/noticias?categoria=Cat1,Cat2
   */
  byCategories(categorias: string[], page: number, size: number): Observable<NewsPage> {
    const categoriaParam = categorias.join(',');
    return this.http.get<NewsPage>(`${this.baseUrl}/articulos/noticias`, {
      params: {
        categoria: categoriaParam,
        page,
        size
      }
    });
  }

  /**
   * ✅ Buscar por rango de fechas
   * GET /api/articulos/fecha?desde=...&hasta=...
   * (formato típico: YYYY-MM-DD)
   */
  byDateRange(desde: string, hasta: string, page: number, size: number): Observable<NewsPage> {
    return this.http.get<NewsPage>(`${this.baseUrl}/articulos/fecha`, {
      params: {
        desde,
        hasta,
        page,
        size
      }
    });
  }

  importCsv(file: File, columnas: string[] = []): Observable<ArticuloImportResult> {
    const form = new FormData();
    form.append('file', file);

    columnas.forEach(col => form.append('columnas', col));
    // si columnas está vacío, el backend tomará todas

    return this.http.post<ArticuloImportResult>(
      `${this.baseUrl}/articulos/import-csv`,
      form
    );
  }
}
