import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { AuthService } from '../../../core/services/auth.service';
import { LoginRequest } from '../../../core/models';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {

  loginForm: FormGroup;
  loading = false;
  hidePassword = true;
  rememberMe = false;
  
  private destroy$ = new Subject<void>();

  // Mensajes de error personalizados
  errorMessages = {
    email: {
      required: 'El correo electrónico es obligatorio',
      email: 'Ingresa un correo electrónico válido'
    },
    password: {
      required: 'La contraseña es obligatoria',
      minlength: 'La contraseña debe tener al menos 6 caracteres'
    }
  };

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.createForm();
  }

  ngOnInit(): void {
    // Verificar si ya está autenticado
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    // Cargar credenciales guardadas si existe "recordar"
    this.loadSavedCredentials();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  private loadSavedCredentials(): void {
    const savedEmail = localStorage.getItem('remembered_email');
    if (savedEmail) {
      this.loginForm.patchValue({ email: savedEmail });
      this.rememberMe = true;
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    const credentials: LoginRequest = this.loginForm.value;

    this.authService.login(credentials)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (response) => {
          // Manejar "recordar usuario"
          this.handleRememberMe(credentials.email);
          
          // Redirigir según el rol
          this.redirectByRole(response.rol);
        },
        error: (error) => {
          console.error('Error en login:', error);
          // El error ya se muestra via toastr en el service
        }
      });
  }

  private handleRememberMe(email: string): void {
    if (this.rememberMe) {
      localStorage.setItem('remembered_email', email);
    } else {
      localStorage.removeItem('remembered_email');
    }
  }

  private redirectByRole(roleId: number): void {
    this.router.navigate(['/dashboard']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  // Getters para validaciones en el template
  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }

  // Métodos para mostrar errores
  getEmailError(): string {
    const control = this.email;
    if (control?.errors && control.touched) {
      if (control.errors['required']) return this.errorMessages.email.required;
      if (control.errors['email']) return this.errorMessages.email.email;
    }
    return '';
  }

  getPasswordError(): string {
    const control = this.password;
    if (control?.errors && control.touched) {
      if (control.errors['required']) return this.errorMessages.password.required;
      if (control.errors['minlength']) return this.errorMessages.password.minlength;
    }
    return '';
  }

  // Métodos de utilidad
  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  onForgotPassword(): void {
    console.log('Funcionalidad de recuperación pendiente');
  }

  // Método para demo (eliminar en producción)
  fillDemoCredentials(): void {
    this.loginForm.patchValue({
      email: 'admin@diegoswafles.com',
      password: 'admin123'
    });
  }
}