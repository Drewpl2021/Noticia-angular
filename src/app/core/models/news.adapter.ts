import { DbNewsSpring, NewsItem, PageSpring } from './news.model';

function splitCsv(s: string | null | undefined): string[] {
  if (!s) return [];
  return s.split(',').map(x => x.trim()).filter(Boolean);
}

function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function toNewsItem(db: DbNewsSpring): NewsItem {
  const summarySource = db.contenido ?? db.titulo ?? '';
  const summaryText = stripHtml(summarySource);
  const summary = summaryText.length > 180 ? summaryText.slice(0, 177) + '…' : summaryText;

  // fechaPublicado ya viene como "2025-09-11T00:05:53" -> válido para date pipe.
  const publishedAt = db.fechaPublicado;

  return {
    id: db.id,
    url: db.url,
    title: db.titulo,
    author: db.autor,
    publishedAt,
    imageUrl: db.imagenUrl,
    content: db.contenido,
    summary,
    tags: splitCsv(db.tags),
    categories: splitCsv(db.categorias),
  };
}

// Si quieres, también puedes crear un helper para mapear PageSpring<T> a tu PageDto
export interface PageDto<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number; // número actual
  size: number;
}

export function mapPage<T, U>(page: PageSpring<T>, mapItem: (t: T) => U): PageDto<U> {
  return {
    content: page.content.map(mapItem),
    totalElements: page.totalElements,
    totalPages: page.totalPages,
    page: page.number,
    size: page.size,
  };
}
