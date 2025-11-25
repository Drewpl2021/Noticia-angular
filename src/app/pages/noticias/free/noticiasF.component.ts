import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import {
  ReactiveFormsModule,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  switchMap,
  catchError,
  of,
  tap,
  map,
  combineLatest,
  interval,
  startWith
} from 'rxjs';
import { NewsService } from '../../../core/services/news.service';
import { NewsPage } from '../../../core/models/news.model';

type FilterMode = 'default' | 'text' | 'date' | 'categories';

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [CommonModule, HttpClientModule, ReactiveFormsModule, RouterLink],
  templateUrl: './noticiasF.component.html',
  styleUrls: ['./noticiasF.component.css']
})
export class NoticiasFComponent {
  private api = inject(NewsService);

  loading = true;
  errorMsg: string | null = null;

  // paginación
  page = signal(0);
  size = signal(6);
  totalPages = signal(0);

  // modo de filtro actual
  mode = signal<FilterMode>('default');

  // categorías seleccionadas (multi-select)
  selectedCategories = signal<string[]>([]);

  // formulario de filtros
  filterForm = new FormGroup({
    q: new FormControl<string>('', { nonNullable: true }),
    from: new FormControl<string | null>(null),
    to: new FormControl<string | null>(null)
  });

  // categorías desde backend
  categories$ = this.api.categories().pipe(
    catchError(() => of<string[]>([]))
  );

  // stream principal de noticias
  news$ = combineLatest([
    toObservable(this.page),
    toObservable(this.mode),
    this.filterForm.valueChanges.pipe(startWith(this.filterForm.getRawValue())),
    toObservable(this.selectedCategories)
  ]).pipe(
    switchMap(([p, mode, form, cats]) => {
      this.loading = true;
      const size = this.size();
      let req$;

      const q = (form.q ?? '').trim();
      const from = form.from;
      const to = form.to;

      // decidir qué API llamar según modo
      if (mode === 'text' && q.length > 0) {
        req$ = this.api.search(q, p, size);
      } else if (mode === 'date' && from && to) {
        req$ = this.api.byDateRange(from, to, p, size);
      } else if (mode === 'categories' && cats.length > 0) {
        req$ = this.api.byCategories(cats, p, size);
      } else {
        // sin filtros → listado normal
        req$ = this.api.list({ page: p, size });
      }

      return req$.pipe(
        tap(res => {
          this.totalPages.set(res.totalPages);
          this.loading = false;
          this.errorMsg = null;
        }),
        catchError(() => {
          this.loading = false;
          this.errorMsg = 'Error cargando noticias';

          const empty: NewsPage = {
            content: [],
            totalElements: 0,
            totalPages: 0,
            size: this.size(),
            number: p
          };
          return of(empty);
        })
      );
    })
  );

  // tendencias
  trends$ = this.api.trending().pipe(catchError(() => of([])));

  // newsletter
  email = new FormControl('', [Validators.required, Validators.email]);

  submitNewsletter() {
    if (this.email.invalid) return;
    this.api.subscribe(this.email.value!).subscribe({
      next: () => {
        alert('¡Gracias por suscribirte!');
        this.email.reset();
      },
      error: () => alert('No se pudo suscribir. Intenta más tarde.')
    });
  }

  // ====== FILTROS ======

  onApplyFilters() {
    // decide modo según lo que haya llenado el usuario
    const { q, from, to } = this.filterForm.getRawValue();
    const cats = this.selectedCategories();

    if (q && q.trim().length > 0) {
      this.mode.set('text');
    } else if (from && to) {
      this.mode.set('date');
    } else if (cats.length > 0) {
      this.mode.set('categories');
    } else {
      this.mode.set('default');
    }

    this.page.set(0);
  }

  resetFilters() {
    this.filterForm.reset({
      q: '',
      from: null,
      to: null
    });
    this.selectedCategories.set([]);
    this.mode.set('default');
    this.page.set(0);
  }

  toggleCategory(cat: string) {
    const current = this.selectedCategories();
    const exists = current.includes(cat);
    const next = exists
      ? current.filter(c => c !== cat)
      : [...current, cat];

    this.selectedCategories.set(next);

    // si hay categorías, modo categorías; si no, re-evaluamos
    if (next.length > 0) {
      this.mode.set('categories');
    } else {
      const { q, from, to } = this.filterForm.getRawValue();
      if (q && q.trim().length > 0) {
        this.mode.set('text');
      } else if (from && to) {
        this.mode.set('date');
      } else {
        this.mode.set('default');
      }
    }

    this.page.set(0);
  }

  clearCategoryFilter() {
    this.selectedCategories.set([]);
    const { q, from, to } = this.filterForm.getRawValue();
    if (q && q.trim().length > 0) {
      this.mode.set('text');
    } else if (from && to) {
      this.mode.set('date');
    } else {
      this.mode.set('default');
    }
    this.page.set(0);
  }

  // ====== Paginación ======
  goTo(p: number) {
    const last = Math.max(0, this.totalPages() - 1);
    const next = Math.min(Math.max(0, p), last);
    if (next !== this.page()) {
      this.loading = true;
      this.page.set(next);
    }
  }
  nextPage() { this.goTo(this.page() + 1); }
  prevPage() { this.goTo(this.page() - 1); }
  firstPage() { this.goTo(0); }
  lastPage() { this.goTo(this.totalPages() - 1); }

  pageRange(): number[] {
    const total = this.totalPages();
    if (!total) return [];
    const current = this.page();
    const start = Math.max(0, Math.min(current - 2, total - 5));
    const end = Math.min(total - 1, start + 4);
    const arr: number[] = [];
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  }
  getTagsFromContent(contenido?: string | null): string[] {
    if (!contenido) return [];
    return contenido
      .split('\n')                // separa por saltos de línea
      .map(t => t.trim())
      .filter(t => !!t)           // quita vacíos
      .slice(0, 2);               // primeras 2 líneas como tags
  }

  // reloj
  now$ = interval(1000).pipe(
    startWith(0),
    map(() => new Date())
  );
}
