import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import {
  SolicitudesNoticiasService,
  SolicitudNoticia
} from '../../../core/services/solicitudes-noticias.service';
import { catchError, of, startWith, switchMap, tap } from 'rxjs';

const ESTADOS = ['TODAS', 'PENDIENTE', 'APROBADO', 'RECHAZADO'];

@Component({
  standalone: true,
  selector: 'app-solicitudes-admin',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './solicitudes.component.html',
  styleUrls: ['./solicitudes.component.css']
})
export class SolicitudesAdminComponent {
  private api = inject(SolicitudesNoticiasService);

  estados = ESTADOS;
  estadoControl = new FormControl<string>('PENDIENTE', { nonNullable: true });

  loading = signal(false);
  actionLoadingId = signal<number | null>(null);
  message = signal<string | null>(null);
  errorMsg = signal<string | null>(null);

  solicitudes$ = this.estadoControl.valueChanges.pipe(
    startWith(this.estadoControl.value),
    tap(() => {
      this.loading.set(true);
      this.message.set(null);
      this.errorMsg.set(null);
    }),
    switchMap(estado => {
      const filtroEstado = estado === 'TODAS' ? undefined : estado;
      return this.api.listarTodas(filtroEstado).pipe(
        catchError(err => {
          console.error('Error cargando solicitudes', err);
          this.errorMsg.set('No se pudieron cargar las solicitudes.');
          return of<SolicitudNoticia[]>([]);
        })
      );
    }),
    tap(() => this.loading.set(false))
  );

  trackById(_i: number, s: SolicitudNoticia) {
    return s.id;
  }

  private reloadSameEstado() {
    this.estadoControl.setValue(this.estadoControl.value, { emitEvent: true });
  }

  aprobar(s: SolicitudNoticia) {
    if (this.actionLoadingId() !== null) return;
    this.actionLoadingId.set(s.id);
    this.message.set(null);
    this.errorMsg.set(null);

    this.api.aprobar(s.id).subscribe({
      next: () => {
        this.message.set(`Solicitud #${s.id} aprobada correctamente.`);
        this.actionLoadingId.set(null);
        this.reloadSameEstado();
      },
      error: err => {
        console.error('Error aprobando', err);
        this.errorMsg.set('No se pudo aprobar la solicitud.');
        this.actionLoadingId.set(null);
      }
    });
  }

  rechazar(s: SolicitudNoticia) {
    if (this.actionLoadingId() !== null) return;
    this.actionLoadingId.set(s.id);
    this.message.set(null);
    this.errorMsg.set(null);

    this.api.rechazar(s.id).subscribe({
      next: () => {
        this.message.set(`Solicitud #${s.id} rechazada correctamente.`);
        this.actionLoadingId.set(null);
        this.reloadSameEstado();
      },
      error: err => {
        console.error('Error rechazando', err);
        this.errorMsg.set('No se pudo rechazar la solicitud.');
        this.actionLoadingId.set(null);
      }
    });
  }

  isRowProcessing(s: SolicitudNoticia): boolean {
    return this.actionLoadingId() === s.id;
  }
}
