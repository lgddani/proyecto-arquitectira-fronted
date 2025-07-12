import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    
    if (this.authService.isAuthenticated()) {
      
      // Verificar roles si están definidos en la ruta
      const requiredRoles = route.data['roles'] as string[];
      
      if (requiredRoles && requiredRoles.length > 0) {
        const userRole = this.authService.getUserRole();
        
        if (!requiredRoles.includes(userRole)) {
          this.router.navigate(['/dashboard']);
          return false;
        }
      }
      
      return true;
    }

    // Redirigir al login si no está autenticado
    this.router.navigate(['/auth/login']);
    return false;
  }
}

// Guard adicional para verificar roles específicos
@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    
    const requiredRoles = route.data['roles'] as string[];
    const userRole = this.authService.getUserRole();
    
    if (requiredRoles && requiredRoles.includes(userRole)) {
      return true;
    }
    
    this.router.navigate(['/dashboard']);
    return false;
  }
}