import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

import { environment } from '../../../environments/environment';

import { 
  ApiResponse, 
  LoginRequest, 
  LoginResponse, 
  User, 
  UserRegister 
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private toastr: ToastrService
  ) {
    // Verificar si hay un usuario guardado al inicializar
    this.checkStoredUser();
  }

  // ========================================
  // MÉTODOS DE AUTENTICACIÓN
  // ========================================

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        map(response => {
          if (response.status && response.data) {
            this.setSession(response.data);
            this.toastr.success(response.alert, 'Éxito');
            return response.data;
          }
          throw new Error(response.alert || 'Error en login');
        }),
        catchError(error => {
          const message = error.error?.alert || error.message || 'Error de conexión';
          this.toastr.error(message, 'Error de Login');
          return throwError(() => error);
        })
      );
  }

  register(userData: UserRegister): Observable<User> {
    return this.http.post<ApiResponse<User>>(`${this.apiUrl}/auth/register`, userData)
      .pipe(
        map(response => {
          if (response.status && response.data) {
            this.toastr.success(response.alert, 'Éxito');
            return response.data;
          }
          throw new Error(response.alert || 'Error en registro');
        }),
        catchError(error => {
          const message = error.error?.alert || error.message || 'Error de conexión';
          this.toastr.error(message, 'Error de Registro');
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    // Limpiar almacenamiento local
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Limpiar subject
    this.currentUserSubject.next(null);
    
    // Redirigir al login
    this.router.navigate(['/auth/login']);
    this.toastr.info('Sesión cerrada correctamente', 'Logout');
  }

  // ========================================
  // MÉTODOS DE VERIFICACIÓN
  // ========================================

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getUserRole(): string {
    const user = this.getCurrentUser();
    if (!user) return '';
    
    // Mapear el rol ID a nombre
    const roleMap: { [key: number]: string } = {
      1: 'Administrador',
      2: 'Vendedor'
    };
    
    return roleMap[user.rolID] || '';
  }

  hasRole(roles: string[]): boolean {
    const userRole = this.getUserRole();
    return roles.includes(userRole);
  }

  // ========================================
  // MÉTODOS PRIVADOS
  // ========================================

  private setSession(authResult: LoginResponse): void {
    // Guardar token
    localStorage.setItem('token', authResult.token);
    
    // Crear objeto user simplificado
    const user: User = {
      userID: authResult.userID,
      userName: '', // Se llenará después si es necesario
      userEmail: authResult.email,
      userPhone: '',
      userStatus: true,
      rolID: authResult.rol,
      rolName: this.getRoleName(authResult.rol)
    };
    
    // Guardar usuario
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private checkStoredUser(): void {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr && !this.isTokenExpired(token)) {
      try {
        const user = JSON.parse(userStr) as User;
        this.currentUserSubject.next(user);
      } catch (error) {
        this.logout();
      }
    } else {
      this.logout();
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000; // Convertir a milliseconds
      return Date.now() >= expiry;
    } catch (error) {
      return true; // Si no se puede decodificar, considerar expirado
    }
  }

  private getRoleName(rolID: number): string {
    const roleMap: { [key: number]: string } = {
      1: 'Administrador',
      2: 'Vendedor'
    };
    return roleMap[rolID] || 'Usuario';
  }

  // ========================================
  // MÉTODOS DE GESTIÓN DE PERFIL
  // ========================================

  updatePassword(passwordData: any): Observable<any> {
    return this.http.put<ApiResponse>(`${this.apiUrl}/users/me/password`, passwordData)
      .pipe(
        map(response => {
          if (response.status) {
            this.toastr.success(response.alert, 'Éxito');
            return response;
          }
          throw new Error(response.alert || 'Error al actualizar contraseña');
        }),
        catchError(error => {
          const message = error.error?.alert || error.message || 'Error de conexión';
          this.toastr.error(message, 'Error');
          return throwError(() => error);
        })
      );
  }

  refreshUserData(): Observable<User> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return throwError(() => new Error('No user logged in'));
    }

    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/users/${currentUser.userID}`)
      .pipe(
        map(response => {
          if (response.status && response.data) {
            localStorage.setItem('user', JSON.stringify(response.data));
            this.currentUserSubject.next(response.data);
            return response.data;
          }
          throw new Error(response.alert || 'Error al obtener datos del usuario');
        })
      );
  }
}