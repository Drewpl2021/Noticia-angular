import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import {switchMap, catchError, of, tap, map, combineLatest, interval, startWith} from 'rxjs';
import { NewsService } from '../../core/services/news.service';

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [CommonModule, HttpClientModule, ReactiveFormsModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  private api = inject(NewsService);

  // estado UI
  loading = true;
  errorMsg: string | null = null;

  // paginación
  page = signal(0);
  size = signal(6);
  totalPages = signal(0);

  // categoría seleccionada (null = todas)
  selectedCategory = signal<string | null>(null);

  // observables auxiliares
  categories$ = this.api.categories().pipe(
    catchError(() => of<string[]>([]))
  );

  // feed: depende de page y selectedCategory
  news$ = combineLatest([
    toObservable(this.page),
    toObservable(this.selectedCategory)
  ]).pipe(
    switchMap(([p, cat]) => {
      this.loading = true;
      return this.api.list({ page: p, size: this.size(), categoria: cat ?? undefined }).pipe(
        tap(res => { this.totalPages.set(res.totalPages); this.loading = false; this.errorMsg = null; }),
        catchError(() => {
          this.loading = false; this.errorMsg = 'Error cargando noticias';
          return of({ content: [], totalElements: 0, totalPages: 0, page: p, size: this.size() });
        })
      );
    })
  );

  // trending puede quedarse global o filtrar por cat si quieres
  trends$ = this.api.trending().pipe(catchError(() => of([])));

  // newsletter
  email = new FormControl('', [Validators.required, Validators.email]);
  submitNewsletter() {
    if (this.email.invalid) return;
    this.api.subscribe(this.email.value!).subscribe({
      next: () => { alert('¡Gracias por suscribirte!'); this.email.reset(); },
      error: () => alert('No se pudo suscribir. Intenta más tarde.')
    });
  }

  // acciones
  selectCategory(cat: string | null) {
    // si ya está seleccionada, no refetch innecesario
    if (this.selectedCategory() === cat) return;
    this.selectedCategory.set(cat);
    this.page.set(0); // al cambiar filtro, volvemos a la primera página
  }

  goTo(p: number) {
    const last = Math.max(0, this.totalPages() - 1);
    const next = Math.min(Math.max(0, p), last);
    if (next !== this.page()) { this.loading = true; this.page.set(next); }
  }
  nextPage() { this.goTo(this.page() + 1); }
  prevPage() { this.goTo(this.page() - 1); }
  firstPage() { this.goTo(0); }
  lastPage() { this.goTo(this.totalPages() - 1); }

  pageRange(): number[] {
    const total = this.totalPages(); if (!total) return [];
    const current = this.page();
    const start = Math.max(0, Math.min(current - 2, total - 5));
    const end = Math.min(total - 1, start + 4);
    const arr: number[] = []; for (let i = start; i <= end; i++) arr.push(i);
    return arr;

  }

  now$ = interval(1000).pipe( // cada 1s
    startWith(0),
    map(() => new Date())
  );
}
