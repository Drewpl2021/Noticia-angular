// Request hacia Culqi
export interface CulqiTokenRequest {
  card_number: string;
  cvv: string;
  expiration_month: string; // "09"
  expiration_year: string;  // "2026"
  email: string;
}

// Respuesta simplificada de Culqi
export interface CulqiTokenResponse {
  object: string; // "token"
  id: string;     // tkn_test_...
  type: string;   // "card"
  email: string;
  creation_date: number;
  card_number: string;
  last_four: string;
  active: boolean;
}
