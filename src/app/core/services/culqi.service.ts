// src/app/core/services/culqi.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CulqiTokenRequest, CulqiTokenResponse } from '../models/culqi-token.model';
import { environment } from '../../../environments/environment'; // ajusta ruta

@Injectable({ providedIn: 'root' })
export class CulqiService {
  private http = inject(HttpClient);
  private baseUrl = 'https://api.culqi.com/v2/tokens';

  createToken(body: CulqiTokenRequest): Observable<CulqiTokenResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${environment.culqiPublicKey}`, // pk_test...
    });

    return this.http.post<CulqiTokenResponse>(this.baseUrl, body, { headers });
  }
}
