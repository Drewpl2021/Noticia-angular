import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ScrapperService } from '../../../core/services/scrapper.service';
import { Scrapper, ScrapperPayload } from '../../../core/models/scrapper.model';

@Component({
  standalone: true,
  selector: 'app-scrapper',
  imports: [CommonModule, HttpClientModule, ReactiveFormsModule],
  templateUrl: './scrapper.component.html',
  styleUrls: ['./scrapper.component.css']
})
export class ScrapperComponent implements OnInit {
  private api = inject(ScrapperService);
  private fb = inject(FormBuilder);
  private scrapperApi = inject(ScrapperService);

  scrappers: Scrapper[] = [];
  loading = false;
  errorMsg: string | null = null;

  editing: Scrapper | null = null;

  scrapperForm = this.fb.group({
    logoUrl: ['', [Validators.required]],
    nombrePagina: ['', [Validators.required, Validators.maxLength(150)]],
    url: ['', [Validators.required]]
  });

  ngOnInit(): void {
    this.loadScrappers();
  }

  loadScrappers(): void {
    this.loading = true;
    this.errorMsg = null;

    this.api.list().subscribe({
      next: (data) => {
        this.scrappers = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error listando scrappers', err);
        this.errorMsg = 'No se pudieron cargar las páginas.';
        this.loading = false;
      }
    });
  }

  // Crear nuevo (limpia el form y sale de modo edición)
  startCreate(): void {
    this.editing = null;
    this.scrapperForm.reset({
      logoUrl: '',
      nombrePagina: '',
      url: ''
    });
  }

  // Editar
  startEdit(s: Scrapper): void {
    this.editing = s;
    this.scrapperForm.reset({
      logoUrl: s.logoUrl,
      nombrePagina: s.nombrePagina,
      url: s.url
    });
  }

  save(): void {
    if (this.scrapperForm.invalid) {
      this.scrapperForm.markAllAsTouched();
      return;
    }

    const form = this.scrapperForm.value;
    const payload: ScrapperPayload = {
      logoUrl: form.logoUrl!,
      nombrePagina: form.nombrePagina!,
      url: form.url!
    };

    this.loading = true;
    this.errorMsg = null;

    if (this.editing) {
      this.api.update(this.editing.id, payload).subscribe({
        next: (updated) => {
          this.scrappers = this.scrappers.map(s =>
            s.id === updated.id ? updated : s
          );
          this.editing = null;
          this.scrapperForm.reset();
          this.loading = false;
        },
        error: (err) => {
          console.error('Error actualizando scrapper', err);
          this.errorMsg = 'No se pudo actualizar la página.';
          this.loading = false;
        }
      });
    } else {
      this.api.create(payload).subscribe({
        next: (created) => {
          this.scrappers = [created, ...this.scrappers];
          this.scrapperForm.reset();
          this.loading = false;
        },
        error: (err) => {
          console.error('Error creando scrapper', err);
          this.errorMsg = 'No se pudo crear la página.';
          this.loading = false;
        }
      });
    }
  }

  delete(s: Scrapper): void {
    const ok = confirm(`¿Eliminar "${s.nombrePagina}"?`);
    if (!ok) return;

    this.loading = true;
    this.errorMsg = null;

    this.api.delete(s.id).subscribe({
      next: () => {
        this.scrappers = this.scrappers.filter(x => x.id !== s.id);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error eliminando scrapper', err);
        this.errorMsg = 'No se pudo eliminar la página.';
        this.loading = false;
      }
    });
  }

// fallback para logos que no cargan
  onLogoError(ev: Event) {
    const img = ev.target as HTMLImageElement;
    img.src = 'assets/placeholder-logo.png';
  }

// getters
  get logoUrl() { return this.scrapperForm.get('logoUrl'); }
  get nombrePagina() { return this.scrapperForm.get('nombrePagina'); }
  get urlCtrl() { return this.scrapperForm.get('url'); }

  // Dentro de export class ScrapperComponent { ... }

  onScrape(url: string) {
    if (!url) return;

    console.log('🔍 Enviando scraping para:', url);

    this.scrapperApi.runScraper({ url }).subscribe({
      next: (resp) => {
        console.log('✔ Scraping completado:', resp);
        alert(`Scraping finalizado\nArtículos guardados: ${resp.articulosGuardados}`);
      },
      error: (err) => {
        console.error('❌ Error ejecutando scrapper', err);
        alert('Error ejecutando el scrapper');
      }
    });
  }



}
