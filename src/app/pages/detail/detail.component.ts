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
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.css']
})
export class DetailComponent {
  private route = inject(ActivatedRoute);
  private api = inject(NewsService);
  private sanitizer = inject(DomSanitizer);
  private title = inject(Title);

  // Noticia actual
  item$ = this.route.paramMap.pipe(
    switchMap(params => this.api.byId(Number(params.get('id')))),
    map(n => {
      this.title.setTitle(`${n.title} — Noticias360`);
      const hasHtml = (n.content || '').includes('<');
      const plain = hasHtml ? (n.summary || '') : (n.content || '');
      const lead = (plain.split(/\n/)[0] || '') || (plain.split(/[.!?]\s/)[0] || '');

      return {
        ...n,
        safeContent: this.sanitizer.bypassSecurityTrustHtml(n.content || ''),
        lead
      } as NewsItem & { safeContent: SafeHtml; lead: string };
    }),
    // subir al top cada vez que cambia el id
    tap(() => {
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch {}
    })
  );

  // Más noticias (relacionadas por categoría, excluye la actual y mezcla)
  more$ = this.route.paramMap.pipe(
    switchMap(params => this.api.byId(Number(params.get('id')))),
    switchMap(n => {
      const cat = n.categories?.[0] ?? undefined;
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
