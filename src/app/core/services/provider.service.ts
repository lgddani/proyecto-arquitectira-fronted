// src/app/features/providers/services/providers.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

import { environment } from '../../../environments/environment';

import { ApiResponse, Provider } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ProvidersService {

  private apiUrl = `${environment.apiUrl}/providers`;

  constructor(
    private http: HttpClient,
    private toastr: ToastrService
  ) {}

  // Obtener todos los proveedores
  getProviders(): Observable<Provider[]> {
    return this.http.get<ApiResponse<Provider[]>>(this.apiUrl)
      .pipe(
        map(response => {
          if (response.status && response.data) {
            return response.data;
          }
          throw new Error(response.alert || 'Error al obtener proveedores');
        }),
        catchError(error => {
          const message = error.error?.alert || error.message || 'Error de conexión';
          this.toastr.error(message, 'Error');
          return throwError(() => error);
        })
      );
  }

  // Obtener un proveedor por ID
  getProvider(id: number): Observable<Provider> {
    return this.http.get<ApiResponse<Provider>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => {
          if (response.status && response.data) {
            return response.data;
          }
          throw new Error(response.alert || 'Error al obtener proveedor');
        }),
        catchError(error => {
          const message = error.error?.alert || error.message || 'Error de conexión';
          this.toastr.error(message, 'Error');
          return throwError(() => error);
        })
      );
  }

  // Crear nuevo proveedor
  createProvider(provider: Omit<Provider, 'providerID'>): Observable<Provider> {
    return this.http.post<ApiResponse<Provider>>(this.apiUrl, provider)
      .pipe(
        map(response => {
          if (response.status && response.data) {
            this.toastr.success(response.alert, 'Éxito');
            return response.data;
          }
          throw new Error(response.alert || 'Error al crear proveedor');
        }),
        catchError(error => {
          const message = error.error?.alert || error.message || 'Error de conexión';
          this.toastr.error(message, 'Error');
          return throwError(() => error);
        })
      );
  }

  // Actualizar proveedor
  updateProvider(id: number, provider: Omit<Provider, 'providerID'>): Observable<Provider> {
    return this.http.put<ApiResponse<Provider>>(`${this.apiUrl}/${id}`, provider)
      .pipe(
        map(response => {
          if (response.status && response.data) {
            this.toastr.success(response.alert, 'Éxito');
            return response.data;
          }
          throw new Error(response.alert || 'Error al actualizar proveedor');
        }),
        catchError(error => {
          const message = error.error?.alert || error.message || 'Error de conexión';
          this.toastr.error(message, 'Error');
          return throwError(() => error);
        })
      );
  }

  // Eliminar proveedor
  deleteProvider(id: number): Observable<void> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => {
          if (response.status) {
            this.toastr.success(response.alert, 'Éxito');
            return;
          }
          throw new Error(response.alert || 'Error al eliminar proveedor');
        }),
        catchError(error => {
          const message = error.error?.alert || error.message || 'Error de conexión';
          this.toastr.error(message, 'Error');
          return throwError(() => error);
        })
      );
  }
}