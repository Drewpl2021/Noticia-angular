import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, HttpClientModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private auth = inject(AuthService);

  loading = false;
  errorMsg: string | null = null;

  loginForm = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  onSubmit() {
    console.log('✔ onSubmit disparado');

    if (this.loginForm.invalid) {
      console.log('✖ Form inválido', this.loginForm.value);
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMsg = null;

    const username = this.loginForm.value.username!;
    const password = this.loginForm.value.password!;

    console.log('Enviando al backend:', { username, password });

    this.auth.login({ username, password }).subscribe({
      next: (res) => {
        this.loading = false;

        const role = res.role;  // 👈 llega del backend
        console.log('✔ Login OK — rol:', role);

        if (role === 'admin' || role === '1') {
          this.router.navigateByUrl('/admin');   // ruta exclusiva admin
        } else {
          this.router.navigateByUrl('/');        // usuarios normales
        }
      },

      error: (err) => {
        console.error('✖ Error login', err);
        this.loading = false;
        this.errorMsg = 'Credenciales inválidas o error en el servidor.';
      }
    });
  }

}
