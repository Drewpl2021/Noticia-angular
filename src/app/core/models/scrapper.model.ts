export interface Scrapper {
  id: number;
  logoUrl: string;       // viene de logo_url
  nombrePagina: string;  // viene de nombre_pagina
  url: string;
}
export interface RunScraperRequest {
  url: string;
}

export interface RunScraperResponse {
  url: string;
  articulosGuardados: number;
}

export type ScrapperPayload = Omit<Scrapper, 'id'>;
