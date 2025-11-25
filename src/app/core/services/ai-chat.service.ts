import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  reply: string;
}

@Injectable({ providedIn: 'root' })
export class AiChatService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl; // ej: http://localhost:8080/api

  enviarMensaje(message: string): Observable<string> {
    const body: ChatRequest = { message };

    return this.http.post<ChatResponse>(`${this.baseUrl}/chat`, body).pipe(
      map(res => res.reply)
    );
  }
}
