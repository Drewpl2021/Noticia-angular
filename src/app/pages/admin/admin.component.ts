import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml, Title } from '@angular/platform-browser';
import { switchMap, map, tap } from 'rxjs';
import { NewsService } from '../../core/services/news.service';
import { NewsItem } from '../../core/models/news.model';

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

@Component({
  standalone: true,
  selector: 'app-detail',
  imports: [CommonModule, HttpClientModule, RouterLink],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent {
  private route = inject(ActivatedRoute);
  private api = inject(NewsService);
  private sanitizer = inject(DomSanitizer);
  private title = inject(Title);

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
        safeContent: this.sanitizer.bypassSecurityTrustHtml(n.contenido || ''),
        lead
      } as NewsItem & { safeContent: SafeHtml; lead: string };
    }),
    tap(() => {
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch {}
    })
  );

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

  trackById(_index: number, item: NewsItem) {
    return item.id;
  }
}
