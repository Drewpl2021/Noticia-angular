import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import {UsersService, User, SaveUserRequest} from '../../../core/services/users.service';
import {RolesService, Role} from '../../../core/services/roles.service';

@Component({
  standalone: true,
  selector: 'app-users',
  imports: [CommonModule, HttpClientModule, ReactiveFormsModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  private usersApi = inject(UsersService);
  private rolesApi = inject(RolesService);
  private fb = inject(FormBuilder);

  users: User[] = [];
  roles: Role[] = [];

  loading = false;
  errorMsg: string | null = null;

  // si es null -> creando; si no -> editando
  editingUser: User | null = null;

  userForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    nombre: ['', [Validators.required]],
    apellido: ['', [Validators.required]],
    roleId: [null as number | null, [Validators.required]]
  });

  ngOnInit(): void {
    this.loadUsers();
    this.loadRoles();
  }

  loadUsers(): void {
    this.loading = true;
    this.errorMsg = null;

    this.usersApi.list().subscribe({
      next: (data) => {
        this.users = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error listando usuarios', err);
        this.errorMsg = 'No se pudieron cargar los usuarios.';
        this.loading = false;
      }
    });
  }

  loadRoles(): void {
    this.rolesApi.list().subscribe({
      next: (data) => (this.roles = data),
      error: (err) => {
        console.error('Error cargando roles', err);
      }
    });
  }

  // ===== Crear =====
  startCreate(): void {
    this.editingUser = null;
    this.userForm.reset({
      username: '',
      email: '',
      nombre: '',
      apellido: '',
      roleId: null
    });
  }

  // ===== Editar =====
  startEdit(user: User): void {
    this.editingUser = user;

    this.userForm.reset({
      username: user.username,
      email: user.email,
      nombre: user.name,
      apellido: user.lastName,
      roleId: user.rol?.id ?? null
    });
  }

  // ===== Guardar (crear / actualizar) =====
  save(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const v = this.userForm.value;
    const payload: SaveUserRequest = {
      username: v.username!,
      email: v.email!,
      name: v.nombre!,
      lastName: v.apellido!,
      roleId: v.roleId!
    };

    this.loading = true;
    this.errorMsg = null;

    if (this.editingUser) {
      // actualizar
      this.usersApi.update(this.editingUser.id, payload).subscribe({
        next: (updated) => {
          this.users = this.users.map(u =>
            u.id === updated.id ? updated : u
          );
          this.editingUser = null;
          this.userForm.reset();
          this.loading = false;
        },
        error: (err) => {
          console.error('Error actualizando usuario', err);
          this.errorMsg = 'No se pudo actualizar el usuario.';
          this.loading = false;
        }
      });
    } else {
      // crear
      this.usersApi.create(payload).subscribe({
        next: (created) => {
          this.users = [created, ...this.users];
          this.userForm.reset();
          this.loading = false;
        },
        error: (err) => {
          console.error('Error creando usuario', err);
          this.errorMsg = 'No se pudo crear el usuario.';
          this.loading = false;
        }
      });
    }
  }

  // ===== Eliminar =====
  delete(user: User): void {
    const ok = confirm(
      `¿Seguro que deseas eliminar al usuario "${user.username}"?`
    );
    if (!ok) return;

    this.loading = true;
    this.errorMsg = null;

    this.usersApi.delete(user.id).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== user.id);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error eliminando usuario', err);
        this.errorMsg = 'No se pudo eliminar el usuario.';
        this.loading = false;
      }
    });
  }

  // helpers para el template
  get username() { return this.userForm.get('username'); }
  get email() { return this.userForm.get('email'); }
  get nombre() { return this.userForm.get('nombre'); }
  get apellido() { return this.userForm.get('apellido'); }
  get roleId() { return this.userForm.get('roleId'); }
}
