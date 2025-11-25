import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { CsvExportService } from '../../../core/services/csv-export.service';
import { NewsService } from '../../../core/services/news.service';
import { catchError, of } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-csv-panel',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './csvC.component.html',
  styleUrls: ['./csvC.component.css']
})
export class CsvCComponent {
  private csvApi = inject(CsvExportService);
  private newsApi = inject(NewsService);

  loading = signal(false);
  message = signal<string | null>(null);

  // categorías disponibles
  categories$ = this.newsApi.categories().pipe(
    catchError(() => of<string[]>([]))
  );

  // filtros
  form = new FormGroup({
    categorias: new FormControl<string[]>([]),
    desde: new FormControl<string | null>(null),
    hasta: new FormControl<string | null>(null),
    categoriaSingle: new FormControl<string | null>(null)
  });

  // util para descargar
  private downloadCsv(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // ===== acciones =====

  exportAll() {
    this.loading.set(true);
    this.message.set(null);
    this.csvApi.exportAll().subscribe({
      next: blob => {
        this.downloadCsv(blob, 'articulos-todos.csv');
        this.loading.set(false);
      },
      error: () => {
        this.message.set('No se pudo exportar el CSV.');
        this.loading.set(false);
      }
    });
  }

  exportByCategories() {
    const cats = this.form.value.categorias ?? [];
    if (!cats.length) {
      this.message.set('Selecciona al menos una categoría.');
      return;
    }
    this.loading.set(true);
    this.message.set(null);
    this.csvApi.exportByCategories(cats).subscribe({
      next: blob => {
        this.downloadCsv(blob, `articulos-${cats.join('_')}.csv`);
        this.loading.set(false);
      },
      error: () => {
        this.message.set('No se pudo exportar por categorías.');
        this.loading.set(false);
      }
    });
  }

  exportByDates() {
    const { desde, hasta } = this.form.value;
    if (!desde || !hasta) {
      this.message.set('Selecciona fecha desde y hasta.');
      return;
    }
    this.loading.set(true);
    this.message.set(null);
    this.csvApi.exportByDates(desde, hasta).subscribe({
      next: blob => {
        this.downloadCsv(blob, `articulos-${desde}-a-${hasta}.csv`);
        this.loading.set(false);
      },
      error: () => {
        this.message.set('No se pudo exportar por fechas.');
        this.loading.set(false);
      }
    });
  }

  exportByFilters() {
    const { categoriaSingle, desde, hasta } = this.form.value;
    if (!categoriaSingle || !desde || !hasta) {
      this.message.set('Selecciona categoría y rango de fechas.');
      return;
    }
    this.loading.set(true);
    this.message.set(null);
    this.csvApi.exportByFilters(categoriaSingle, desde, hasta).subscribe({
      next: blob => {
        this.downloadCsv(blob, `articulos-${categoriaSingle}-${desde}-a-${hasta}.csv`);
        this.loading.set(false);
      },
      error: () => {
        this.message.set('No se pudo exportar con filtros.');
        this.loading.set(false);
      }
    });
  }

  toggleCategory(cat: string) {
    const current = this.form.value.categorias ?? [];
    const exists = current.includes(cat);
    const next = exists
      ? current.filter(c => c !== cat)
      : [...current, cat];
    this.form.patchValue({ categorias: next });
  }

  isSelected(cat: string): boolean {
    return (this.form.value.categorias ?? []).includes(cat);
  }
}
