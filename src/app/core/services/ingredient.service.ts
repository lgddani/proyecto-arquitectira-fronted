// src/app/features/ingredients/services/ingredients.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

import { environment } from '../../../environments/environment';
import { ApiResponse, Ingredient, IngredientWithProvider, Provider } from '../models';

@Injectable({
  providedIn: 'root'
})
export class IngredientsService {

  private apiUrl = `${environment.apiUrl}/ingredients`;
  private providersUrl = `${environment.apiUrl}/providers`;

  constructor(
    private http: HttpClient,
    private toastr: ToastrService
  ) {}

  // Obtener todos los ingredientes con información de proveedores
  getIngredientsWithProviders(): Observable<IngredientWithProvider[]> {
    return forkJoin({
      ingredients: this.getIngredients(),
      providers: this.getProviders()
    }).pipe(
      map(({ ingredients, providers }) => {
        return ingredients.map(ingredient => ({
          ...ingredient,
          providerName: this.getProviderName(ingredient.providerID, providers)
        }));
      })
    );
  }

  // Obtener todos los ingredientes
  getIngredients(): Observable<Ingredient[]> {
    return this.http.get<ApiResponse<any[]>>(this.apiUrl)
      .pipe(
        map(response => {
          if (response.status && response.data) {
            return response.data.map(item => ({
              ingredientID: item.ingredientID,
              ingredientName: item.ingredientName,
              ingredientUnit: item.ingredientUnit,
              ingredientQuantity: item.ingredientQuantity,
              minimumQuantity: item.minimumQuantity,
              providerID: item.providerID
            }));
          }
          throw new Error(response.alert || 'Error al obtener ingredientes');
        }),
        catchError(error => {
          const message = error.error?.alert || error.message || 'Error de conexión';
          this.toastr.error(message, 'Error');
          return throwError(() => error);
        })
      );
  }

  // Obtener un ingrediente por ID
  getIngredient(id: number): Observable<Ingredient> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => {
          if (response.status && response.data) {
            const item = response.data;
            return {
              ingredientID: item.ingredientID,
              ingredientName: item.ingredientName,
              ingredientUnit: item.ingredientUnit,
              ingredientQuantity: item.ingredientQuantity,
              minimumQuantity: item.minimumQuantity,
              providerID: item.providerID
            };
          }
          throw new Error(response.alert || 'Error al obtener ingrediente');
        }),
        catchError(error => {
          const message = error.error?.alert || error.message || 'Error de conexión';
          this.toastr.error(message, 'Error');
          return throwError(() => error);
        })
      );
  }

  // Crear nuevo ingrediente
  createIngredient(ingredient: Omit<Ingredient, 'ingredientID'>): Observable<Ingredient> {
    const payload = {
      ingredientName: ingredient.ingredientName,
      ingredientUnit: ingredient.ingredientUnit,
      ingredientQuantity: ingredient.ingredientQuantity,
      minimumQuantity: ingredient.minimumQuantity,
      providerID: ingredient.providerID
    };

    return this.http.post<ApiResponse<any>>(this.apiUrl, payload)
      .pipe(
        map(response => {
          if (response.status && response.data) {
            this.toastr.success(response.alert, 'Éxito');
            const item = response.data;
            return {
              ingredientID: item.ingredientID,
              ingredientName: item.ingredientName,
              ingredientUnit: item.ingredientUnit,
              ingredientQuantity: item.ingredientQuantity,
              minimumQuantity: item.minimumQuantity,
              providerID: item.providerID
            };
          }
          throw new Error(response.alert || 'Error al crear ingrediente');
        }),
        catchError(error => {
          const message = error.error?.alert || error.message || 'Error de conexión';
          this.toastr.error(message, 'Error');
          return throwError(() => error);
        })
      );
  }

  // Actualizar ingrediente
  updateIngredient(id: number, ingredient: Omit<Ingredient, 'ingredientID'>): Observable<Ingredient> {
    const payload = {
      ingredientName: ingredient.ingredientName,
      ingredientUnit: ingredient.ingredientUnit,
      ingredientQuantity: ingredient.ingredientQuantity,
      minimumQuantity: ingredient.minimumQuantity,
      providerID: ingredient.providerID
    };

    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${id}`, payload)
      .pipe(
        map(response => {
          if (response.status && response.data) {
            this.toastr.success(response.alert, 'Éxito');
            const item = response.data;
            return {
              ingredientID: item.ingredientID,
              ingredientName: item.ingredientName,
              ingredientUnit: item.ingredientUnit,
              ingredientQuantity: item.ingredientQuantity,
              minimumQuantity: item.minimumQuantity,
              providerID: item.providerID
            };
          }
          throw new Error(response.alert || 'Error al actualizar ingrediente');
        }),
        catchError(error => {
          const message = error.error?.alert || error.message || 'Error de conexión';
          this.toastr.error(message, 'Error');
          return throwError(() => error);
        })
      );
  }

  // Eliminar ingrediente
  deleteIngredient(id: number): Observable<void> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => {
          if (response.status) {
            this.toastr.success(response.alert, 'Éxito');
            return;
          }
          throw new Error(response.alert || 'Error al eliminar ingrediente');
        }),
        catchError(error => {
          const message = error.error?.alert || error.message || 'Error de conexión';
          this.toastr.error(message, 'Error');
          return throwError(() => error);
        })
      );
  }

  // Obtener proveedores para el dropdown
  getProviders(): Observable<Provider[]> {
    return this.http.get<ApiResponse<Provider[]>>(this.providersUrl)
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

  // Obtener unidades de medida disponibles
  getUnits(): string[] {
    return ['kg', 'gr', 'l', 'ml', 'u'];
  }

  // Obtener nombre de la unidad
  getUnitLabel(unit: string): string {
    const unitLabels: { [key: string]: string } = {
      'kg': 'Kilogramos',
      'gr': 'Gramos',
      'l': 'Litros',
      'ml': 'Mililitros',
      'u': 'Unidades'
    };
    return unitLabels[unit] || unit;
  }

  // Método auxiliar para obtener nombre del proveedor
  private getProviderName(providerId: number, providers: Provider[]): string {
    const provider = providers.find(p => p.providerID === providerId);
    return provider ? provider.providerName : 'Proveedor no encontrado';
  }
}