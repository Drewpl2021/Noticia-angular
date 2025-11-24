import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators
} from '@angular/forms';
import {
  SolicitudesNoticiasService,
  SolicitudNoticia,
  SolicitudNoticiaRequest
} from '../../core/services/solicitudes-noticias.service';
import { catchError, of, startWith, switchMap } from 'rxjs';

const ESTADOS = ['TODAS', 'PENDIENTE', 'APROBADO', 'RECHAZADO'];

@Component({
  standalone: true,
  selector: 'app-solicitudes-noticias',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './solicitudes-noticias.component.html',
  styleUrls: ['./solicitudes-noticias.component.css']
})
export class SolicitudesNoticiasComponent {
  private api = inject(SolicitudesNoticiasService);
  nombreCompleto: string = '';

  loading = signal(false);
  successMsg = signal<string | null>(null);
  errorMsg = signal<string | null>(null);

  // ====== usuario logueado (id) ======
  // Aquí suponemos que guardaste el objeto del login en localStorage como "auth"
  private usuarioId: number | null = null;

  constructor() {
    try {
      // 👈 Usa la clave correcta
      const raw = localStorage.getItem('auth_user');


      if (raw) {
        const parsed = JSON.parse(raw);


        this.usuarioId = parsed.id ?? null;

        this.nombreCompleto =
          (parsed.name ?? '') + ' ' + (parsed.lastName ?? '');

      } else {
      }

    } catch (err) {
      this.usuarioId = null;
      this.nombreCompleto = '';
    }
  }

  private getNowAsDateTimeLocal(): string {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');

    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());

    const hour = pad(d.getHours());
    const min = pad(d.getMinutes());

    return `${year}-${month}-${day}T${hour}:${min}`;
  }

  // ===== Formulario de creación =====
  form = new FormGroup({
    url: new FormControl('http://localhost:4200/crearNoticia', { nonNullable: true, validators: [Validators.required] }),
    titulo: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    fechaPublicado: new FormControl<string | null>(this.getNowAsDateTimeLocal()),
    imagenUrl: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    contenido: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(30)] }),
    tags: new FormControl('', { nonNullable: true }),
    categorias: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  // ===== Filtro "mis solicitudes" por estado =====
  estados = ESTADOS;
  estadoControl = new FormControl<string>('TODAS', { nonNullable: true });

  solicitudes$ = this.estadoControl.valueChanges.pipe(
    startWith(this.estadoControl.value),
    switchMap(estado => {
      if (this.usuarioId == null) {
        return of<SolicitudNoticia[]>([]);
      }

      const filtroEstado = estado === 'TODAS' ? undefined : estado;
      return this.api.listarMias(this.usuarioId, filtroEstado).pipe(
        catchError(() => of<SolicitudNoticia[]>([]))
      );
    })
  );

  // ========= Métodos =========

  submit() {
    this.successMsg.set(null);
    this.errorMsg.set(null);

    if (this.usuarioId == null) {
      this.errorMsg.set('No se pudo identificar al usuario. Inicia sesión nuevamente.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMsg.set('Completa los campos obligatorios.');
      return;
    }

    this.loading.set(true);

    const raw = this.form.getRawValue();

    const fechaIso = raw.fechaPublicado
      ? new Date(raw.fechaPublicado).toISOString()
      : new Date().toISOString();

    const body: SolicitudNoticiaRequest = {
      url: raw.url!,
      titulo: raw.titulo!,
      autor: this.nombreCompleto,          // 👈 AUTOMÁTICO
      fechaPublicado: fechaIso,
      imagenUrl: raw.imagenUrl!,
      contenido: raw.contenido!,
      tags: raw.tags || '',
      categorias: raw.categorias!,
      usuarioId: this.usuarioId            // 👈 de token
    };


    this.api.crearSolicitud(body).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMsg.set('Solicitud enviada correctamente. Será revisada por el equipo editorial.');
        this.form.reset({
          url: '',
          titulo: '',
          fechaPublicado: null,
          imagenUrl: '',
          contenido: '',
          tags: '',
          categorias: ''
        });
        // recargar mis solicitudes con el estado actual
        this.estadoControl.setValue(this.estadoControl.value);
      },
      error: () => {
        this.loading.set(false);
        this.errorMsg.set('No se pudo enviar la solicitud. Inténtalo nuevamente.');
      }
    });
  }

  // helpers
  hasError(ctrlName: keyof typeof this.form.controls, err: string): boolean {
    const ctrl = this.form.get(ctrlName);
    return !!ctrl && ctrl.touched && ctrl.hasError(err);
  }

  trackById(_i: number, s: SolicitudNoticia) {
    return s.id;
  }
}
