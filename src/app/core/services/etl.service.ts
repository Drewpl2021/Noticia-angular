import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CsvColumnAnalysis {
  name: string;
  nullCount: number;
  nullPercent: number;
  duplicateCount: number;
  duplicatePercent: number;
}

export interface CsvAnalysisResult {
  totalRows: number;
  columns: CsvColumnAnalysis[];
}

@Injectable({ providedIn: 'root' })
export class EtlService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl + '/etl';

  /** 1) Análisis */
  analizarCsv(file: File): Observable<CsvAnalysisResult> {
    const fd = new FormData();
    fd.append('file', file);

    return this.http.post<CsvAnalysisResult>(`${this.baseUrl}/analisis`, fd);
  }

  /** 2) Aplicar ETL + Exportar CSV limpio */
  aplicarEtl(file: File, columnas: string[], keyColumn: string = 'url'): Observable<Blob> {
    const fd = new FormData();
    fd.append('file', file);

    columnas.forEach(c => fd.append('columnas', c));
    fd.append('keyColumn', keyColumn);

    return this.http.post(`${this.baseUrl}/aplicar`, fd, {
      responseType: 'blob' // descarga CSV
    });
  }
}
