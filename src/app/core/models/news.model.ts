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
  title: string;
  author?: string | null;
  publishedAt: string;         // ISO string
  imageUrl?: string | null;
  content?: string | null;     // puede venir con HTML
  summary: string;             // texto plano para cards
  tags: string[];
  categories: string[];        // array (de 'categorias')
}
