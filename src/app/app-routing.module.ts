import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

const routes: Routes = [
  // Ruta por defecto
  { 
    path: '', 
    redirectTo: '/dashboard', 
    pathMatch: 'full' 
  },
  
  // Módulo de autenticación (sin guard)
  {
    path: 'auth',
    // loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
  },
  
  // Dashboard (requiere autenticación)
  {
    path: 'dashboard',
    // loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule),
    canActivate: [AuthGuard]
  },
  
  // Gestión de proveedores (solo administradores)
  {
    path: 'providers',
    // loadChildren: () => import('./features/providers/providers.module').then(m => m.ProvidersModule),
    canActivate: [AuthGuard],
    data: { roles: ['Administrador'] }
  },
  
  // Gestión de ingredientes (solo administradores)
  {
    path: 'ingredients',
    // loadChildren: () => import('./features/ingredients/ingredients.module').then(m => m.IngredientsModule),
    canActivate: [AuthGuard],
    data: { roles: ['Administrador'] }
  },
  
  // Gestión de recetas (solo administradores)
  {
    path: 'recipes',
    // loadChildren: () => import('./features/recipes/recipes.module').then(m => m.RecipesModule),
    canActivate: [AuthGuard],
    data: { roles: ['Administrador'] }
  },
  
  // Gestión de productos (solo administradores)
  {
    path: 'products',
    // loadChildren: () => import('./features/products/products.module').then(m => m.ProductsModule),
    canActivate: [AuthGuard],
    data: { roles: ['Administrador'] }
  },
  
  // Gestión de órdenes (administradores y vendedores)
  {
    path: 'orders',
    // loadChildren: () => import('./features/orders/orders.module').then(m => m.OrdersModule),
    canActivate: [AuthGuard],
    data: { roles: ['Administrador', 'Vendedor'] }
  },
  
  // Gestión de usuarios (solo administradores)
  {
    path: 'users',
    // loadChildren: () => import('./features/users/users.module').then(m => m.UsersModule),
    canActivate: [AuthGuard],
    data: { roles: ['Administrador'] }
  },
  
  // Ruta 404 - página no encontrada
  {
    path: '**',
    // loadChildren: () => import('./features/not-found/not-found.module').then(m => m.NotFoundModule)
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    enableTracing: false, // Cambiar a true para debug
    scrollPositionRestoration: 'top'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }