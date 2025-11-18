import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { NewsPage, NewsItem } from '../models/news.model';

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
}
