// src/app/pages/suscripcion/tresPasos/tres-pasos.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';

import { Producto } from '../../../../core/models/producto.model';
import { ProductoService } from '../../../../core/services/producto.service';
import { AuthService } from '../../../../core/services/auth.service';

import { CulqiService } from '../../../../core/services/culqi.service';
import { CulqiTokenRequest } from '../../../../core/models/culqi-token.model';
import { PaymentService } from '../../../../core/services/payment.service';
import { CrearMembresiaRequest } from '../../../../core/models/payment.model';

@Component({
  standalone: true,
  selector: 'app-suscripcion-tres-pasos',
  templateUrl: './tres-pasos.component.html',
  styleUrls: ['./tres-pasos.component.css'],
  imports: [CommonModule, ReactiveFormsModule, RouterLink]
})
export class TresPasosComponent implements OnInit {

  // planes
  planes = signal<Producto[]>([]);
  planesLoading = signal(false);
  planesError = signal<string | null>(null);

  // wizard
  step = signal<1 | 2 | 3>(1);
  selectedPlan = signal<Producto | null>(null);

  // datos cliente
  customerForm: FormGroup;
  cardForm: FormGroup;

  // pago
  payLoading = signal(false);
  paymentStatus = signal<'idle' | 'success' | 'error'>('idle');
  paymentMessage = signal<string | null>(null);
  paymentMethod = signal<'card' | 'yape' | 'plin'>('card');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productoApi: ProductoService,
    private paymentApi: PaymentService,
    private auth: AuthService,
    private fb: FormBuilder,
    private culqi: CulqiService,
  ) {
    this.customerForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      tipoDocumento: ['DNI', Validators.required],
      documento: ['', [Validators.required, Validators.minLength(8)]],
    });

    this.cardForm = this.fb.group({
      card_number: ['', [Validators.required, Validators.minLength(13)]],
      cvv: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(4)]],
      expiration_month: ['', [Validators.required]],
      expiration_year: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    // si no está logueado, mándalo a login
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    // precargar form con datos del usuario si tienes
    const u = this.auth.user();
    this.customerForm.patchValue({
      nombre: u ? `${u.name} ${u.lastName ?? ''}`.trim() : '',
      email: (u as any)?.username ?? (u as any)?.email ?? ''
    });

    const preselectedId = Number(this.route.snapshot.paramMap.get('productoId'));

    this.planesLoading.set(true);
    this.productoApi.listar().subscribe({
      next: (data) => {
        const activos = data.filter(p => p.tipo === 'SUSCRIPCION' && p.estado === 'ACTIVO');
        this.planes.set(activos);
        this.planesLoading.set(false);

        if (preselectedId && !Number.isNaN(preselectedId)) {
          const found = activos.find(p => p.id === preselectedId) || null;
          if (found) {
            this.selectedPlan.set(found);
            // puedes dejarlo en step 1 igual, o saltar al 2:
            // this.step.set(2);
          }
        }
      },
      error: (err) => {
        console.error('Error cargando planes', err);
        this.planesError.set('No se pudieron cargar los planes.');
        this.planesLoading.set(false);
      }
    });
  }

  // ====== PASO 1: seleccionar plan ======
  seleccionarPlan(plan: Producto) {
    this.selectedPlan.set(plan);
  }

  continuarDesdeStep1() {
    if (!this.selectedPlan()) {
      return;
    }
    this.step.set(2);
  }

  // ====== PASO 2: datos ======
  backToStep1() {
    this.step.set(1);
  }

  goToStep3() {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      return;
    }
    this.paymentStatus.set('idle');
    this.paymentMessage.set(null);
    this.step.set(3);
  }

  // ====== PASO 3: pago ======
  setPaymentMethod(method: 'card' | 'yape' | 'plin') {
    this.paymentMethod.set(method);
    this.cardError.set(null);
    this.paymentStatus.set('idle');
    this.paymentMessage.set(null);
  }


// ...

  pagar() {
    const plan = this.selectedPlan();
    if (!plan) return;

    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      return;
    }

    const u = this.auth.user();
    if (!u) {
      this.paymentStatus.set('error');
      this.paymentMessage.set('Debes iniciar sesión para pagar.');
      return;
    }

    this.payLoading.set(true);
    this.paymentStatus.set('idle');
    this.paymentMessage.set(null);
    this.cardError.set(null);
    this.showCardError.set(false);

    if (this.paymentMethod() === 'card') {
      // 1) crear token Culqi
      if (this.cardForm.invalid) {
        this.cardForm.markAllAsTouched();
        this.payLoading.set(false);
        return;
      }

      const email = this.customerForm.value.email!;
      const tokenReq: CulqiTokenRequest = {
        ...this.cardForm.value,
        email
      } as CulqiTokenRequest;

      this.culqi.createToken(tokenReq).subscribe({
        next: (tokenResp) => {
          console.log('Token Culqi:', tokenResp);

          const body: CrearMembresiaRequest = {
            usuarioId: u.id,
            productoId: plan.id,
            sourceId: tokenResp.id,
            email,
            descripcion: `Pago de Membresía ${plan.nombre}`
          };

          // 2) llamar a backend
          this.sendCrearMembresia(body);
        },
        error: (err) => {
          console.error('Error creando token Culqi', err);

          const culqiError = err?.error;
          const msg =
            culqiError?.user_message ||
            culqiError?.merchant_message ||
            'No se pudo validar la tarjeta. Verifica los datos.';

          this.cardError.set(msg);
          this.showCardError.set(true);    // 🔴 aquí se abre el modal
          this.payLoading.set(false);
        }
      });

    } else {
      // Yape / Plin...
      const email = this.customerForm.value.email!;
      const body: CrearMembresiaRequest = {
        usuarioId: u.id,
        productoId: plan.id,
        sourceId: this.paymentMethod(),
        email,
        descripcion: `Pago de Membresía ${plan.nombre} (${this.paymentMethod()})`
      };

      this.sendCrearMembresia(body);
    }
  }



  private sendCrearMembresia(body: CrearMembresiaRequest) {
    this.paymentApi.crearMembresia(body).subscribe({
      next: (resp) => {
        if (resp.success) {
          this.paymentStatus.set('success');
          this.paymentMessage.set(resp.message || 'Pago realizado correctamente.');

          this.showSuccess.set(true);

          setTimeout(() => {
            this.router.navigate(['/']);
          }, 2500);

        } else {
          this.paymentStatus.set('error');
          this.paymentMessage.set(resp.message || 'No se pudo procesar el pago.');
        }

        this.payLoading.set(false);
      },
      error: (err) => {
        console.error('Error creando membresía', err);

        this.paymentStatus.set('error');
        this.paymentMessage.set('Ocurrió un error al procesar el pago/membresía.');

        // aquí podrías usar otro overlay si quieres,
        // pero este ya es error de backend, no de tarjeta
        this.payLoading.set(false);
      }
    });
  }

  getPlanFeatures(plan: Producto): string[] {
    const nombre = (plan.nombre || '').toLowerCase();
    const precio = plan.precio ?? 0;

    // Base para todos
    const base = [
      'Acceso a las noticias',
      'Buscar noticias por nombre',
      'Buscar noticias por categoría'
    ];

    // 1) PLAN FREE
    if (nombre.includes('free') || nombre.includes('gratis') || precio === 0) {
      return base;
    }

    // 2) PLAN CLÁSICO MENSUAL 14.99
    if (nombre.includes('clásico') || nombre.includes('clasico') || Math.abs(precio - 14.99) < 0.01) {
      return [
        ...base,
        'Buscar noticias por fecha',
        'Descargar datos en CSV',
        'Crear noticias'
      ];
    }

    // 3) PLAN PREMIUM MENSUAL 29.99
    if (nombre.includes('premium mensual') || (nombre.includes('premium') && Math.abs(precio - 29.99) < 0.01)) {
      return [
        ...base,
        'Buscar noticias por fecha',
        'Descargar datos en CSV',
        'Crear noticias',
        'Descargar datos CSV filtrando por fecha y categoría',
        'Realizar ETL de la data descargada',
        'Data Smart con 4 dimensiones'
      ];
    }

    // 4) PLAN PREMIUM ANUAL 249.99
    if (nombre.includes('anual') || Math.abs(precio - 249.99) < 0.5) {
      return [
        ...base,
        'Buscar noticias por fecha',
        'Descargar datos en CSV',
        'Crear noticias',
        'Descargar datos CSV filtrando por fecha y categoría',
        'Realizar ETL de la data descargada',
        'Data Smart con 4 dimensiones',
        '% de descuento frente al plan mensual'
      ];
    }

    // Fallback para cualquier otro producto/plan
    return base;
  }


  irAlPanel() {
    this.router.navigate(['/']);
  }

  showSuccess = signal(false);
  showCardError = signal(false);
  cardError = signal<string | null>(null);

  cerrarCardError() {
    this.showCardError.set(false);
    this.cardError.set(null);
  }

}
