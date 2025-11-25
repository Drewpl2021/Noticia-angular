// src/app/pages/suscripcion/tresPasos/tres-pasos.component.ts
import { Component, OnInit, OnDestroy, signal } from '@angular/core';
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
export class TresPasosComponent implements OnInit, OnDestroy {

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

  // overlays
  showSuccess = signal(false);
  showCardError = signal(false);
  cardError = signal<string | null>(null);

  // 🔹 contador para logout después de éxito
  logoutCountdown = signal(5);
  private logoutTimerId: any = null;

  // 🔹 plan actual del usuario (nombre tal como viene del backend)
  currentUserPlanName = signal<string | null>(null);

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

    // guardar el nombre del plan actual del usuario
    this.currentUserPlanName.set(this.auth.getCurrentPlan());

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
          // solo preseleccionamos si NO está bloqueado
          if (found && !this.isPlanDisabled(found)) {
            this.selectedPlan.set(found);
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

  ngOnDestroy(): void {
    this.clearLogoutCountdown();
  }

  // ========== HELPERS DE PLANES (bloqueos) ==========

  private normalizeName(name: string | null | undefined): string {
    if (!name) return '';
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  // ¿El plan que viene del backend es free?
  private isFreePlan(plan: Producto): boolean {
    const nombre = this.normalizeName(plan.nombre);
    const precio = plan.precio ?? 0;
    return (
      nombre.includes('free') ||
      nombre.includes('gratis') ||
      precio === 0
    );
  }

  // ¿El plan actual del usuario es free?
  private isUserCurrentPlanFree(): boolean {
    const current = this.normalizeName(this.currentUserPlanName());
    if (!current) return false;
    return current.includes('free') || current.includes('gratis');
  }

  // ¿Este plan es exactamente el plan actual del usuario?
  isUserPlan(plan: Producto): boolean {
    const current = this.normalizeName(this.currentUserPlanName());
    const planName = this.normalizeName(plan.nombre);
    if (!current || !planName) return false;
    return current === planName;
  }

  // ¿El usuario tiene algún plan distinto a Free?
  private userHasPaidPlan(): boolean {
    const current = this.currentUserPlanName();
    if (!current) return false;
    // si NO es free, asumimos que es un plan de pago
    return !this.isUserCurrentPlanFree();
  }

  // 🔒 Lógica final de bloqueo:
  // - Si es su propio plan actual → bloqueado
  // - Si ya tiene un plan de pago → bloqueamos también el plan Free
  isPlanDisabled(plan: Producto): boolean {
    if (this.isUserPlan(plan)) {
      return true;
    }

    if (this.userHasPaidPlan() && this.isFreePlan(plan)) {
      return true;
    }

    return false;
  }

  // ====== PASO 1: seleccionar plan ======
  seleccionarPlan(plan: Producto) {
    // si el plan está bloqueado, no hacemos nada
    if (this.isPlanDisabled(plan)) return;
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
          this.showCardError.set(true);
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

          // Mostrar overlay de éxito y arrancar countdown
          this.showSuccess.set(true);
          this.startLogoutCountdown();
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
        this.payLoading.set(false);
      }
    });
  }

  // ====== FEATURES POR PLAN (como ya tenías) ======
  getPlanFeatures(plan: Producto): string[] {
    const nombre = (plan.nombre || '').toLowerCase();
    const precio = plan.precio ?? 0;

    const base = [
      'Acceso a las noticias',
      'Buscar noticias por nombre',
      'Buscar noticias por categoría',
      'Acceso a Nova360'
    ];

    if (nombre.includes('free') || nombre.includes('gratis') || precio === 0) {
      return base;
    }

    if (nombre.includes('clásico') || nombre.includes('clasico') || Math.abs(precio - 14.99) < 0.01) {
      return [
        ...base,
        'Buscar noticias por fecha',
        'Descargar datos en CSV',
        'Crear noticias',
        'Acceso a Nova360'
      ];
    }

    if (nombre.includes('premium mensual') || (nombre.includes('premium') && Math.abs(precio - 29.99) < 0.01)) {
      return [
        ...base,
        'Buscar noticias por fecha',
        'Descargar datos en CSV',
        'Crear noticias',
        'Descargar datos CSV filtrando por fecha y categoría',
        'Realizar ETL de la data descargada',
        'Data Smart con 4 dimensiones',
        'Acceso a Nova360'
      ];
    }

    if (nombre.includes('anual') || Math.abs(precio - 249.99) < 0.5) {
      return [
        ...base,
        'Buscar noticias por fecha',
        'Descargar datos en CSV',
        'Crear noticias',
        'Descargar datos CSV filtrando por fecha y categoría',
        'Realizar ETL de la data descargada',
        'Data Smart con 4 dimensiones',
        'Acceso a Nova360',
        '% de descuento frente al plan mensual'
      ];
    }

    return base;
  }

  // ====== Logout después de compra ======
  private startLogoutCountdown() {
    this.clearLogoutCountdown();
    this.logoutCountdown.set(5);

    this.logoutTimerId = setInterval(() => {
      const current = this.logoutCountdown();
      if (current <= 1) {
        this.clearLogoutCountdown();
        this.handleLogoutAfterPurchase();
      } else {
        this.logoutCountdown.set(current - 1);
      }
    }, 1000);
  }

  private clearLogoutCountdown() {
    if (this.logoutTimerId) {
      clearInterval(this.logoutTimerId);
      this.logoutTimerId = null;
    }
  }

  private handleLogoutAfterPurchase() {
    this.auth.logout();
    this.showSuccess.set(false);
    this.router.navigate(['/login']);
  }

  confirmLogoutAfterPurchase() {
    this.clearLogoutCountdown();
    this.handleLogoutAfterPurchase();
  }

  cerrarCardError() {
    this.showCardError.set(false);
    this.cardError.set(null);
  }

  openCancelConfirm() {
    this.showCancelConfirm.set(true);
  }

  closeCancelConfirm() {
    this.showCancelConfirm.set(false);
  }

  confirmCancelSubscription() {
    // aquí podrías llamar a un servicio al backend en el futuro
    this.showCancelConfirm.set(false);
    this.showCancelSuccess.set(true);
  }

  closeCancelSuccess() {
    this.showCancelSuccess.set(false);
  }

  showCancelConfirm = signal(false);
  showCancelSuccess = signal(false);
}
