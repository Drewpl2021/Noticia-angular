// src/app/core/services/payment.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CrearMembresiaRequest, MembresiaResponse } from '../models/payment.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/payments/membresia`;
  // => http://localhost:8080/api/payments/membresia

  crearMembresia(body: CrearMembresiaRequest): Observable<MembresiaResponse> {
    return this.http.post<MembresiaResponse>(this.baseUrl, body);
  }
}
