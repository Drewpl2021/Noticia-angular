// src/app/core/services/datamart.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DimensionCandidate {
  name: string;
  distinctCount: number;
  distinctRatio: number;
  sampleValues: string[];
  suggested: boolean;
}

export interface MeasureCandidate {
  name: string;
  nonNullCount: number;
  numericRatio: number;
  suggested: boolean;
}

export interface DatamartAnalysisResult {
  totalRows: number;
  dimensionCandidates: DimensionCandidate[];
  measureCandidates: MeasureCandidate[];
}

@Injectable({ providedIn: 'root' })
export class DatamartService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl + '/datamart';

  analizarCsv(file: File): Observable<DatamartAnalysisResult> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<DatamartAnalysisResult>(`${this.baseUrl}/analisis`, fd);
  }

  /** NUEVO — construir tablas + exportar ZIP con dimensiones y fact */
  construirYExportarZip(
    file: File,
    nombre: string,
    dimensiones: string[],
    medidas: string[]
  ): Observable<Blob> {

    const fd = new FormData();
    fd.append('file', file);
    fd.append('nombre', nombre);

    dimensiones.forEach(d => fd.append('dimensiones', d));
    medidas.forEach(m => fd.append('medidas', m));

    return this.http.post(`${this.baseUrl}/construir-y-exportar-zip`, fd, {
      responseType: 'blob'
    });
  }
}
