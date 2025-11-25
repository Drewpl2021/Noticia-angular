import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import { EtlService, CsvAnalysisResult } from '../../core/services/etl.service';

@Component({
  standalone: true,
  selector: 'app-etl-articulos',
  imports: [CommonModule, HttpClientModule],
  templateUrl: './etl-articulos.component.html',
  styleUrls: ['./etl-articulos.component.css']
})
export class EtlArticulosComponent {

  private etl = inject(EtlService);

  selectedFile: File | null = null;

  fileName = signal<string>('Ningún archivo seleccionado');
  loading = signal<boolean>(false);

  analysis = signal<CsvAnalysisResult | null>(null);
  errorMsg = signal<string | null>(null);
  successMsg = signal<string | null>(null);

  /** columnas que el usuario puede elegir */
  allColumns = signal<string[]>([]);
  selectedColumns = new Set<string>();

  /** ===== EVENTO: archivo ===== */
  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;

    this.selectedFile = file;
    this.analysis.set(null);
    this.fileName.set(file ? file.name : 'Ningún archivo seleccionado');
  }

  /** ===== EVENTO: seleccionar columna ===== */
  toggleColumn(col: string, event: Event) {
    const input = event.target as HTMLInputElement | null;
    const checked = !!input?.checked;

    if (checked) this.selectedColumns.add(col);
    else this.selectedColumns.delete(col);
  }

  /** ===== 1) ANALIZAR ===== */
  analizar() {
    if (!this.selectedFile) {
      this.errorMsg.set('Selecciona un archivo CSV primero.');
      return;
    }

    this.loading.set(true);
    this.errorMsg.set(null);
    this.successMsg.set(null);

    this.etl.analizarCsv(this.selectedFile).subscribe({
      next: (res) => {
        this.analysis.set(res);
        this.allColumns.set(res.columns.map(c => c.name));
        this.loading.set(false);
      },
      error: () => {
        this.errorMsg.set('Error analizando el CSV.');
        this.loading.set(false);
      }
    });
  }

  /** ===== 2) APLICAR ETL ===== */
  aplicar() {
    if (!this.selectedFile) {
      this.errorMsg.set('Selecciona un archivo CSV primero.');
      return;
    }

    this.loading.set(true);
    this.errorMsg.set(null);
    this.successMsg.set(null);

    const cols = Array.from(this.selectedColumns);

    this.etl.aplicarEtl(this.selectedFile, cols, 'url').subscribe({
      next: (blob) => {
        /** descargar CSV */
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'etl_result.csv';
        a.click();
        window.URL.revokeObjectURL(url);

        this.successMsg.set('ETL ejecutado y archivo exportado correctamente.');
        this.loading.set(false);
      },
      error: () => {
        this.errorMsg.set('Error ejecutando ETL.');
        this.loading.set(false);
      }
    });
  }

  /** util para bucles en el template */
  get columnsForTable() {
    return this.analysis()?.columns ?? [];
  }
}
