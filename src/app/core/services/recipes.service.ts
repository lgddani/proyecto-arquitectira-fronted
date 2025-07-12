// src/app/features/recipes/services/recipes.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

import { environment } from '../../../environments/environment';
import { ApiResponse, Recipe, RecipeDetailDTO, Ingredient, IngredientWithProvider } from '../models';

export interface RecipeCreateRequest {
  recipeName: string;
  ingredients: {
    ingredientID: number;
    requiredQuantity: number;
  }[];
}

export interface RecipeWithDetails {
  recipeID: number;
  recipeName: string;
  ingredientDetails: {
    ingredientID: number;
    ingredientName: string;
    ingredientUnit: string;
    requiredQuantity: number;
    availableQuantity: number;
    canMake: boolean;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class RecipesService {

  private apiUrl = `${environment.apiUrl}/recipes`;
  private ingredientsUrl = `${environment.apiUrl}/ingredients`;

  constructor(
    private http: HttpClient,
    private toastr: ToastrService
  ) {}

  // Obtener todas las recetas con detalles
  getRecipesWithDetails(): Observable<RecipeWithDetails[]> {
    return forkJoin({
      recipes: this.getRecipes(),
      ingredients: this.getIngredients()
    }).pipe(
      map(({ recipes, ingredients }) => {
        return recipes.map(recipe => this.enrichRecipeWithDetails(recipe, ingredients));
      })
    );
  }

  // Obtener todas las recetas
  getRecipes(): Observable<RecipeDetailDTO[]> {
    return this.http.get<ApiResponse<any[]>>(this.apiUrl)
      .pipe(
        map(response => {
          if (response.status && response.data) {
            return response.data.map(item => ({
              recipeID: item.recipeID,
              recipeName: item.recipeName,
              ingredients: item.ingredients?.map((ing: any) => ({
                ingredientID: ing.ingredientID,
                ingredientName: ing.ingredientName,
                ingredientUnit: ing.ingredientUnit,
                requiredQuantity: ing.requiredQuantity
              })) || []
            }));
          }
          throw new Error(response.alert || 'Error al obtener recetas');
        }),
        catchError(error => {
          const message = error.error?.alert || error.message || 'Error de conexión';
          this.toastr.error(message, 'Error');
          return throwError(() => error);
        })
      );
  }

  // Obtener una receta por ID
  getRecipe(id: number): Observable<RecipeDetailDTO> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => {
          if (response.status && response.data) {
            const item = response.data;
            return {
              recipeID: item.recipeID,
              recipeName: item.recipeName,
              ingredients: item.ingredients?.map((ing: any) => ({
                ingredientID: ing.ingredientID,
                ingredientName: ing.ingredientName,
                ingredientUnit: ing.ingredientUnit,
                requiredQuantity: ing.requiredQuantity
              })) || []
            };
          }
          throw new Error(response.alert || 'Error al obtener receta');
        }),
        catchError(error => {
          const message = error.error?.alert || error.message || 'Error de conexión';
          this.toastr.error(message, 'Error');
          return throwError(() => error);
        })
      );
  }

  // Crear nueva receta
  createRecipe(recipe: RecipeCreateRequest): Observable<RecipeDetailDTO> {
    const payload = {
      recipeName: recipe.recipeName,
      ingredients: recipe.ingredients
    };

    return this.http.post<ApiResponse<any>>(this.apiUrl, payload)
      .pipe(
        map(response => {
          if (response.status && response.data) {
            this.toastr.success(response.alert, 'Éxito');
            const item = response.data;
            return {
              recipeID: item.recipeID,
              recipeName: item.recipeName,
              ingredients: item.ingredients?.map((ing: any) => ({
                ingredientID: ing.ingredientID,
                ingredientName: ing.ingredientName,
                ingredientUnit: ing.ingredientUnit,
                requiredQuantity: ing.requiredQuantity
              })) || []
            };
          }
          throw new Error(response.alert || 'Error al crear receta');
        }),
        catchError(error => {
          const message = error.error?.alert || error.message || 'Error de conexión';
          this.toastr.error(message, 'Error');
          return throwError(() => error);
        })
      );
  }

  // Actualizar receta
  updateRecipe(id: number, recipe: RecipeCreateRequest): Observable<RecipeDetailDTO> {
    const payload = {
      recipeName: recipe.recipeName,
      ingredients: recipe.ingredients
    };

    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${id}`, payload)
      .pipe(
        map(response => {
          if (response.status && response.data) {
            this.toastr.success(response.alert, 'Éxito');
            const item = response.data;
            return {
              recipeID: item.recipeID,
              recipeName: item.recipeName,
              ingredients: item.ingredients?.map((ing: any) => ({
                ingredientID: ing.ingredientID,
                ingredientName: ing.ingredientName,
                ingredientUnit: ing.ingredientUnit,
                requiredQuantity: ing.requiredQuantity
              })) || []
            };
          }
          throw new Error(response.alert || 'Error al actualizar receta');
        }),
        catchError(error => {
          const message = error.error?.alert || error.message || 'Error de conexión';
          this.toastr.error(message, 'Error');
          return throwError(() => error);
        })
      );
  }

  // Eliminar receta
  deleteRecipe(id: number): Observable<void> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => {
          if (response.status) {
            this.toastr.success(response.alert, 'Éxito');
            return;
          }
          throw new Error(response.alert || 'Error al eliminar receta');
        }),
        catchError(error => {
          const message = error.error?.alert || error.message || 'Error de conexión';
          this.toastr.error(message, 'Error');
          return throwError(() => error);
        })
      );
  }

  // Obtener ingredientes disponibles
  getIngredients(): Observable<IngredientWithProvider[]> {
    return this.http.get<ApiResponse<any[]>>(this.ingredientsUrl)
      .pipe(
        map(response => {
          if (response.status && response.data) {
            return response.data.map(item => ({
              ingredientID: item.ingredientID,
              ingredientName: item.ingredientName,
              ingredientUnit: item.ingredientUnit,
              ingredientQuantity: item.ingredientQuantity,
              minimumQuantity: item.minimumQuantity,
              providerID: item.providerID,
              providerName: 'Proveedor' // Se puede mejorar después
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

    private enrichRecipeWithDetails(recipe: RecipeDetailDTO, availableIngredients: IngredientWithProvider[]): RecipeWithDetails {
    const ingredientDetails = recipe.ingredients.map(recipeIngredient => {
        const availableIngredient = availableIngredients.find(
        ing => ing.ingredientID === recipeIngredient.ingredientID
        );

        return {
        ingredientID: recipeIngredient.ingredientID,
        ingredientName: recipeIngredient.ingredientName,
        ingredientUnit: recipeIngredient.ingredientUnit,
        requiredQuantity: recipeIngredient.requiredQuantity,
        availableQuantity: availableIngredient?.ingredientQuantity || 0,
        canMake: (availableIngredient?.ingredientQuantity || 0) >= recipeIngredient.requiredQuantity
        };
    });

    return {
        recipeID: recipe.recipeID,
        recipeName: recipe.recipeName,
        ingredientDetails
    };
    }

  // Verificar si se puede hacer una receta
  canMakeRecipe(recipe: RecipeWithDetails): boolean {
    return recipe.ingredientDetails.every(ingredient => ingredient.canMake);
  }

  // Calcular cuántas porciones se pueden hacer
  getMaxPortions(recipe: RecipeWithDetails): number {
    if (recipe.ingredientDetails.length === 0) return 0;
    
    return Math.floor(
      Math.min(
        ...recipe.ingredientDetails.map(ingredient => 
          ingredient.availableQuantity / ingredient.requiredQuantity
        )
      )
    );
  }
}