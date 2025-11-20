// src/app/core/models/payment.model.ts
export interface CrearMembresiaRequest {
  usuarioId: number;
  productoId: number;
  sourceId: string;      // token de Culqi: tkn_test_...
  email: string;
  descripcion: string;
}

export interface MembresiaResponse {
  success: boolean;
  message: string;
  chargeId?: string;
  membresiaId?: number;
  rawResponse?: string;
}
