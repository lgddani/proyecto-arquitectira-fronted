import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

const routes: Routes = [
  // Ruta por defecto - redirigir según autenticación
  { 
    path: '', 
    redirectTo: '/auth/login', 
    pathMatch: 'full' 
  },
  
  // Módulo de autenticación (sin guard)
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
  },
  
  // Rutas principales con layout
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule)
      },
      
      {
        path: 'providers',
        loadChildren: () => import('./features/providers/providers.module').then(m => m.ProvidersModule),
        data: { roles: ['Administrador'] }
      },
      
      {
        path: 'ingredients',
        loadChildren: () => import('./features/ingredients/ingredients.module').then(m => m.IngredientsModule),
        data: { roles: ['Administrador'] }
      },
      
      // {
      //   path: 'recipes',
      //   loadChildren: () => import('./features/recipes/recipes.module').then(m => m.RecipesModule),
      //   data: { roles: ['Administrador'] }
      // },
      
      // {
      //   path: 'products',
      //   loadChildren: () => import('./features/products/products.module').then(m => m.ProductsModule),
      //   data: { roles: ['Administrador'] }
      // },
      
      // {
      //   path: 'orders',
      //   loadChildren: () => import('./features/orders/orders.module').then(m => m.OrdersModule),
      //   data: { roles: ['Administrador', 'Vendedor'] }
      // },
      
      // {
      //   path: 'users',
      //   loadChildren: () => import('./features/users/users.module').then(m => m.UsersModule),
      //   data: { roles: ['Administrador'] }
      // }
    ]
  },
  
  // Ruta 404 - página no encontrada
  {
    path: '**',
    redirectTo: '/auth/login'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    enableTracing: false,
    scrollPositionRestoration: 'top'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }