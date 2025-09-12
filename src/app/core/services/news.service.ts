import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, map } from 'rxjs';
import { DbNewsSpring } from '../models/news.model';
import { toNewsItem, mapPage, PageDto } from '../models/news.adapter';

@Injectable({ providedIn: 'root' })
export class NewsService {
  private http = inject(HttpClient);
  private base = environment.apiUrl; // p.ej. http://localhost:8080/api

  list(opts?: { page?: number; size?: number; categoria?: string; q?: string }): Observable<PageDto<ReturnType<typeof toNewsItem>>> {
    let params = new HttpParams();
    if (opts?.page != null) params = params.set('page', String(opts.page));
    if (opts?.size != null) params = params.set('size', String(opts.size));
    if (opts?.categoria)     params = params.set('categoria', opts.categoria);
    if (opts?.q)             params = params.set('q', opts.q);

    return this.http.get<any>(`${this.base}/noticias`, { params }).pipe(
      map(page => mapPage<DbNewsSpring, ReturnType<typeof toNewsItem>>(page, toNewsItem))
    );
  }

  trending() {
    return this.http.get<DbNewsSpring[]>(`${this.base}/noticias/trending`).pipe(
      map(list => list.map(toNewsItem))
    );
  }

  categories() {
    return this.http.get<string[]>(`${this.base}/categorias`);
  }

  subscribe(email: string) {                              // <-- añade este método si no lo tenías
    return this.http.post(`${this.base}/newsletter/subscriptions`, { email });
  }

  byId(id: number) {
    return this.http.get<DbNewsSpring>(`${this.base}/${id}`).pipe(map(toNewsItem));
  }
}
