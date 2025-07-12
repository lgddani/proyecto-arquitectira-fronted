import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private router: Router,
    private toastr: ToastrService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    
    // Obtener token del localStorage
    const token = localStorage.getItem('token');
    
    // Clonar la request para agregar headers
    let authRequest = request;
    
    if (token) {
      authRequest = request.clone({
        headers: request.headers.set('Authorization', `Bearer ${token}`)
      });
    }

    // Agregar Content-Type si no existe
    if (!authRequest.headers.has('Content-Type') && !(authRequest.body instanceof FormData)) {
      authRequest = authRequest.clone({
        headers: authRequest.headers.set('Content-Type', 'application/json')
      });
    }

    return next.handle(authRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        
        // Manejar errores de autenticación
        if (error.status === 401) {
          this.toastr.error('Sesión expirada', 'Error de Autenticación');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          this.router.navigate(['/auth/login']);
        }
        
        // Manejar errores de servidor
        else if (error.status === 500) {
          this.toastr.error('Error interno del servidor', 'Error');
        }
        
        // Manejar errores de conexión
        else if (error.status === 0) {
          this.toastr.error('No se puede conectar al servidor', 'Error de Conexión');
        }

        return throwError(() => error);
      })
    );
  }
}