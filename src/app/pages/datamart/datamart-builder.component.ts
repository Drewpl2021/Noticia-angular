import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import {
  DatamartService,
  DatamartAnalysisResult,
  DimensionCandidate,
  MeasureCandidate
} from '../../core/services/datamart.service';

@Component({
  standalone: true,
  selector: 'app-datamart-builder',
  imports: [CommonModule, HttpClientModule],
  templateUrl: './datamart-builder.component.html',
  styleUrls: ['./datamart-builder.component.css']
})
export class DatamartBuilderComponent {

  private datamartApi = inject(DatamartService);

  // ===== estado base =====
  selectedFile: File | null = null;
  fileName = signal<string>('Ningún archivo seleccionado');

  loading = signal<boolean>(false);
  errorMsg = signal<string | null>(null);
  successMsg = signal<string | null>(null);

  // nombre del datamart
  datamartName = signal<string>('');

  // resultado del análisis
  analysis = signal<DatamartAnalysisResult | null>(null);

  // sets de selección
  selectedDims = new Set<string>();
  selectedMeasures = new Set<string>();

  // ======== HANDLERS DE UI ========

  /** Archivo CSV */
  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;

    this.selectedFile = file;
    this.analysis.set(null);
    this.selectedDims.clear();
    this.selectedMeasures.clear();
    this.errorMsg.set(null);
    this.successMsg.set(null);

    this.fileName.set(file ? file.name : 'Ningún archivo seleccionado');
  }

  /** Nombre del datamart */
  onNameChange(event: Event) {
    const input = event.target as HTMLInputElement | null;
    this.datamartName.set(input?.value ?? '');
  }

  /** Dimensiones para el template */
  get dimensionCandidates(): DimensionCandidate[] {
    return this.analysis()?.dimensionCandidates ?? [];
  }

  /** Medidas para el template */
  get measureCandidates(): MeasureCandidate[] {
    return this.analysis()?.measureCandidates ?? [];
  }

  /** Toggle de dimensión (máx. 5) */
  toggleDim(name: string, event: Event) {
    const input = event.target as HTMLInputElement | null;
    const checked = !!input?.checked;

    if (checked) {
      if (this.selectedDims.size >= 5) {
        // revertimos el check
        if (input) input.checked = false;
        this.errorMsg.set('Solo se permiten hasta 5 dimensiones.');
        return;
      }
      this.selectedDims.add(name);
    } else {
      this.selectedDims.delete(name);
    }
  }

  /** Toggle de medida */
  toggleMeasure(name: string, event: Event) {
    const input = event.target as HTMLInputElement | null;
    const checked = !!input?.checked;

    if (checked) {
      this.selectedMeasures.add(name);
    } else {
      this.selectedMeasures.delete(name);
    }
  }

  // ======== PASO 1: ANALIZAR CSV ========

  analizar() {
    if (!this.selectedFile) {
      this.errorMsg.set('Selecciona un archivo CSV primero.');
      return;
    }

    this.loading.set(true);
    this.errorMsg.set(null);
    this.successMsg.set(null);
    this.analysis.set(null);
    this.selectedDims.clear();
    this.selectedMeasures.clear();

    this.datamartApi.analizarCsv(this.selectedFile).subscribe({
      next: (res) => {
        this.analysis.set(res);

        // Autoseleccionar sugeridos
        res.dimensionCandidates
          .filter(c => c.suggested)
          .forEach(c => this.selectedDims.add(c.name));

        res.measureCandidates
          .filter(c => c.suggested)
          .forEach(c => this.selectedMeasures.add(c.name));

        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.errorMsg.set('No se pudo analizar el CSV para DataMart.');
      }
    });
  }

  construir() {
    if (!this.selectedFile) {
      this.errorMsg.set('Selecciona un archivo CSV primero.');
      return;
    }

    const name = this.datamartName().trim();
    const dims = Array.from(this.selectedDims);
    const measures = Array.from(this.selectedMeasures);

    if (!name) {
      this.errorMsg.set('Debe ingresar un nombre para el DataMart.');
      return;
    }

    if (dims.length === 0) {
      this.errorMsg.set('Selecciona al menos una dimensión.');
      return;
    }

    this.loading.set(true);
    this.errorMsg.set(null);
    this.successMsg.set(null);

    this.datamartApi
      .construirYExportarZip(this.selectedFile, name, dims, measures)
      .subscribe({
        next: (zipBlob) => {
          /** Descargar el ZIP */
          const url = window.URL.createObjectURL(zipBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `datamart_${name}.zip`;
          a.click();

          window.URL.revokeObjectURL(url);

          this.loading.set(false);
          this.successMsg.set('DataMart construido y ZIP descargado correctamente.');
        },

        error: (err) => {
          this.loading.set(false);
          this.errorMsg.set('Error al construir y exportar el DataMart.');
          console.error(err);
        }
      });
  }

}
