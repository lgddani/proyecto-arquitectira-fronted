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

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly apiUrl = environment.apiUrl;
  private readonly currentUserSubject = new BehaviorSubject<User | null>(null);
  public readonly currentUser$ = this.currentUserSubject.asObservable();

  private readonly roleMap: Record<number, string> = {
    1: 'Administrador',
    2: 'Vendedor'
  };

  constructor(
    private http: HttpClient,
    private router: Router,
    private toastr: ToastrService
  ) {
    this.checkStoredUser();
  }

  // ========================================
  // AUTENTICACIÓN
  // ========================================

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        map(res => this.handleApiResponse(res, 'Éxito', true)),
        catchError(err => this.handleApiError(err, 'Error de Login'))
      );
  }

  register(userData: UserRegister): Observable<User> {
    return this.http.post<ApiResponse<User>>(`${this.apiUrl}/auth/register`, userData)
      .pipe(
        map(res => this.handleApiResponse(res, 'Éxito')),
        catchError(err => this.handleApiError(err, 'Error de Registro'))
      );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
    this.toastr.info('Sesión cerrada correctamente', 'Logout');
  }

  // ========================================
  // VERIFICACIÓN
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
    return user ? this.roleMap[user.rolID] || 'Usuario' : '';
  }

  hasRole(roles: string[]): boolean {
    return roles.includes(this.getUserRole());
  }

  // ========================================
  // PERFIL
  // ========================================

  updatePassword(passwordData: any): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.apiUrl}/users/me/password`, passwordData)
      .pipe(
        map(res => this.handleApiResponse(res, 'Éxito')),
        catchError(err => this.handleApiError(err, 'Error'))
      );
  }

  refreshUserData(): Observable<User> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return throwError(() => new Error('No user logged in'));
    }

    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/users/${currentUser.userID}`)
      .pipe(
        map(res => {
          const user = this.handleApiResponse(res);
          localStorage.setItem('user', JSON.stringify(user));
          this.currentUserSubject.next(user);
          return user;
        }),
        catchError(err => this.handleApiError(err, 'Error al obtener datos del usuario'))
      );
  }

  // ========================================
  // UTILIDADES PRIVADAS
  // ========================================

  private setSession(auth: LoginResponse): void {
    localStorage.setItem('token', auth.token);

    const user: User = {
      userID: auth.userID,
      userName: '',
      userEmail: auth.email,
      userPhone: '',
      userStatus: true,
      rolID: auth.rol,
      rolName: this.roleMap[auth.rol] || 'Usuario'
    };

    localStorage.setItem('user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private checkStoredUser(): void {
    const token = this.getToken();
    const userStr = localStorage.getItem('user');

    if (token && userStr && !this.isTokenExpired(token)) {
      try {
        const user = JSON.parse(userStr) as User;
        this.currentUserSubject.next(user);
      } catch {
        this.logout();
      }
    } else {
      this.logout();
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }

  private handleApiResponse<T>(res: ApiResponse<T>, successTitle?: string, setSessionOnLogin = false): T {
    if (res.status && res.data) {
      if (setSessionOnLogin && (res as ApiResponse<LoginResponse>).data.token) {
        this.setSession((res as ApiResponse<LoginResponse>).data);
      }
      if (successTitle) {
        this.toastr.success(res.alert, successTitle);
      }
      return res.data;
    }
    throw new Error(res.alert || 'Operación fallida');
  }

  private handleApiError(error: any, errorTitle: string): Observable<never> {
    const message = error?.error?.alert || error.message || 'Error de conexión';
    this.toastr.error(message, errorTitle);
    return throwError(() => new Error(message));
  }
}
