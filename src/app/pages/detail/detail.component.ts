import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml, Title } from '@angular/platform-browser';
import { switchMap, map, tap } from 'rxjs';
import { NewsService } from '../../core/services/news.service';
import { NewsItem } from '../../core/models/news.model';
import { Location } from '@angular/common';

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

@Component({
  standalone: true,
  selector: 'app-detail',
  imports: [CommonModule, HttpClientModule, RouterLink],
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.css']
})
export class DetailComponent {
  private route = inject(ActivatedRoute);
  private api = inject(NewsService);
  private sanitizer = inject(DomSanitizer);
  private title = inject(Title);
  private location = inject(Location);

  // Noticia actual
  item$ = this.route.paramMap.pipe(
    switchMap(params => this.api.byId(Number(params.get('id')))),
    map((n: NewsItem) => {
      this.title.setTitle(`${n.titulo} — Noticias360`);

      const contenido = n.contenido || '';
      const lead =
        contenido.split(/\n/)[0] ||
        contenido.split(/[.!?]\s/)[0] ||
        '';

      return {
        ...n,
        safeContent: this.sanitizer.bypassSecurityTrustHtml(
          this.formatContent(n.contenido || '')
        ),

        lead
      } as NewsItem & { safeContent: SafeHtml; lead: string };
    }),
    tap(() => {
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch {}
    })
  );
  goBack() {
    this.location.back();
  }

  // Más noticias (relacionadas por categoría, excluye la actual y mezcla)
  more$ = this.route.paramMap.pipe(
    switchMap(params => this.api.byId(Number(params.get('id')))),
    switchMap((n: NewsItem) => {
      const cat = n.categorias || undefined; // string
      return this.api.list({ page: 0, size: 20, categoria: cat }).pipe(
        map(p => p.content.filter(x => x.id !== n.id)),
        map(list => shuffle(list).slice(0, 6))
      );
    })
  );
  getChipsFromContent(contenido?: string | null): string[] | null {
    if (!contenido) return null;

    const chips = contenido
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .slice(0, 3);   // las 2–3 primeras líneas como etiquetas

    return chips.length ? chips : null;  // 👈 si está vacío, devolvemos null
  }


  trackById(_index: number, item: NewsItem) {
    return item.id;
  }

  formatContent(contenido: string): string {
    if (!contenido) return '';

    const lines = contenido
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);

    let html = '';
    let idx = 0;

    // ======= 1. DETECTAR METADATOS AL INICIO =======
    const metaLines: string[] = [];

    while (idx < lines.length) {
      const line = lines[idx];

      // condición: línea corta, sin punto final
      const isMeta =
        line.length > 0 &&
        line.length <= 30 &&
        !line.endsWith('.') &&
        !line.includes(':') &&
        !line.includes('—') &&
        !line.includes('http');

      if (!isMeta) break;

      metaLines.push(line);
      idx++;

      // máximo 3 líneas como metadata
      if (metaLines.length >= 3) break;
    }

    // si encontramos metadata → unimos
    if (metaLines.length) {
      html += `<div class="meta-block">${metaLines.join(' • ')}</div>`;
    }

    // ======= 2. PROCESAR EL RESTO COMO SIEMPRE =======
    const rest = lines.slice(idx);

    const parsed = rest
      .map(line => {
        // títulos auténticos (más largos, con sentido)
        if (line.length <= 50 && /^[A-ZÁÉÍÓÚÑ]/.test(line) && !line.endsWith('.')) {
          return `<h3>${line}</h3>`;
        }

        // listas
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return `<li>${line.substring(2)}</li>`;
        }

        // marcador tipo ⏱️
        if (line.includes('|') || line.startsWith('⏱️')) {
          return `<div class="note">${line}</div>`;
        }

        // párrafo normal
        return `<p>${line}</p>`;
      })
      .join('');

    // envolver listas
    let finalHtml = parsed;
    if (finalHtml.includes('<li>')) {
      finalHtml = finalHtml.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');
    }

    return html + finalHtml;
  }



  protected readonly length = length;
}
