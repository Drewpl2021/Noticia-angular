import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {RunScraperRequest, RunScraperResponse, Scrapper, ScrapperPayload} from '../models/scrapper.model';

@Injectable({ providedIn: 'root' })
export class ScrapperService {

  private baseUrl = `${environment.apiUrl}/scrappers`;

  constructor(private http: HttpClient) {}

  private mapScrapper(api: any): Scrapper {
    return {
      id: api.id,
      logoUrl: api.logo,          // 👈 AQUÍ EL CAMBIO
      nombrePagina: api.nombrePagina,
      url: api.url
    };
  }

  list(): Observable<Scrapper[]> {
    return this.http.get<any[]>(this.baseUrl).pipe(
      map(rows => rows.map(r => this.mapScrapper(r)))
    );
  }

  create(payload: ScrapperPayload): Observable<Scrapper> {
    const body = {
      logo: payload.logoUrl,          // 👈 el backend espera "logo"
      nombrePagina: payload.nombrePagina,
      url: payload.url
    };
    return this.http.post<any>(this.baseUrl, body).pipe(
      map(api => this.mapScrapper(api))
    );
  }

  update(id: number, payload: ScrapperPayload): Observable<Scrapper> {
    const body = {
      logo: payload.logoUrl,
      nombrePagina: payload.nombrePagina,
      url: payload.url
    };
    return this.http.put<any>(`${this.baseUrl}/${id}`, body).pipe(
      map(api => this.mapScrapper(api))
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  runScraper(payload: RunScraperRequest): Observable<RunScraperResponse> {
    return this.http.post<RunScraperResponse>(`${this.baseUrl}/run`, payload);
  }
}
