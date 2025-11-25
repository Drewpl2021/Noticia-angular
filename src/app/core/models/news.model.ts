// Lo que devuelve TU API (según el JSON que pasaste)
export interface DbNewsSpring {
  id: number;
  url: string;
  titulo: string;
  autor: string | null;
  fechaPublicado: string;     // "2025-09-11T00:05:53"
  imagenUrl: string | null;
  contenido: string | null;
  tags: string | null;        // "tag1, tag2"
  categorias: string | null;  // "Tecnología, Mundo" (a veces 1 sola)
  actualizadoEn?: string | null;
}

// Página Spring
export interface PageSpring<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number; // página actual
  // ...otros campos que no necesitamos para la UI
}

// Lo que usa tu UI
export interface NewsItem {
  id: number;
  url: string;
  titulo: string;
  autor: string | null;
  fechaPublicado: string;   // viene como ISO string
  imagenUrl: string;
  contenido: string;
  tags: string;             // ej. "portada, TAXI"
  categorias: string;       // ej. "Otros"
  actualizadoEn: string;
}

export interface NewsPage {
  content: NewsItem[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;          // 👈 coincide con el JSON ("number": 0)

  // Estos son opcionales, solo si quieres usarlos después
  pageable?: any;
  sort?: any;
  first?: boolean;
  last?: boolean;
  numberOfElements?: number;
  empty?: boolean;
}
export interface ArticuloImportResult {
  totalRows: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
  duplicatesInFile: number;
  duplicatesInDb: number;
  nullCounts: { [col: string]: number };
  nullPercents: { [col: string]: number }; // 0–1
}
