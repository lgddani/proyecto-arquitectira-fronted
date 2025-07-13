// src/app/core/services/products.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

import { environment } from '../../../environments/environment';
import { ApiResponse, RecipeDetailDTO } from '../models';

export interface ProductDetailDTO {
  productID: number;
  productName: string;
  productPrice: number;
  recipes: ProductRecipeDetailDTO[];
}

export interface ProductRecipeDetailDTO {
  recipeID: number;
  recipeName: string;
}

export interface ProductCreateRequest {
  productName: string;
  productPrice: number;
  recipeIDs: number[];
}

export interface ProductWithDetails {
  productID: number;
  productName: string;
  productPrice: number;
  recipeDetails: {
    recipeID: number;
    recipeName: string;
    canMake: boolean;
    maxPortions: number;
    ingredients: {
      ingredientName: string;
      requiredQuantity: number;
      ingredientUnit: string;
      availableQuantity: number;
    }[];
  }[];
  canMake: boolean;
  maxPortions: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductsService {

  private apiUrl = `${environment.apiUrl}/products`;
  private recipesUrl = `${environment.apiUrl}/recipes`;

  constructor(
    private http: HttpClient,
    private toastr: ToastrService
  ) {}

  // Obtener todos los productos con detalles
  getProductsWithDetails(): Observable<ProductWithDetails[]> {
    return forkJoin({
      products: this.getProducts(),
      recipes: this.getRecipes()
    }).pipe(
      map(({ products, recipes }) => {
        return products.map(product => this.enrichProductWithDetails(product, recipes));
      })
    );
  }

  // Obtener todos los productos
  getProducts(): Observable<ProductDetailDTO[]> {
    return this.http.get<ApiResponse<any[]>>(this.apiUrl)
      .pipe(
        map(response => {
          if (response.status && response.data) {
            return response.data.map(item => ({
              productID: item.productID,
              productName: item.productName,
              productPrice: item.productPrice,
              recipes: item.recipes?.map((recipe: any) => ({
                recipeID: recipe.recipeID,
                recipeName: recipe.recipeName
              })) || []
            }));
          }
          throw new Error(response.alert || 'Error al obtener productos');
        }),
        catchError(error => {
          const message = error.error?.alert || error.message || 'Error de conexión';
          this.toastr.error(message, 'Error');
          return throwError(() => error);
        })
      );
  }

  // Obtener un producto por ID
  getProduct(id: number): Observable<ProductDetailDTO> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => {
          if (response.status && response.data) {
            const item = response.data;
            return {
              productID: item.productID,
              productName: item.productName,
              productPrice: item.productPrice,
              recipes: item.recipes?.map((recipe: any) => ({
                recipeID: recipe.recipeID,
                recipeName: recipe.recipeName
              })) || []
            };
          }
          throw new Error(response.alert || 'Error al obtener producto');
        }),
        catchError(error => {
          const message = error.error?.alert || error.message || 'Error de conexión';
          this.toastr.error(message, 'Error');
          return throwError(() => error);
        })
      );
  }

  // Crear nuevo producto
  createProduct(product: ProductCreateRequest): Observable<ProductDetailDTO> {
    const payload = {
      productName: product.productName,
      productPrice: product.productPrice,
      recipeIDs: product.recipeIDs
    };

    return this.http.post<ApiResponse<any>>(this.apiUrl, payload)
      .pipe(
        map(response => {
          if (response.status && response.data) {
            this.toastr.success(response.alert, 'Éxito');
            const item = response.data;
            return {
              productID: item.productID,
              productName: item.productName,
              productPrice: item.productPrice,
              recipes: item.recipes?.map((recipe: any) => ({
                recipeID: recipe.recipeID,
                recipeName: recipe.recipeName
              })) || []
            };
          }
          throw new Error(response.alert || 'Error al crear producto');
        }),
        catchError(error => {
          const message = error.error?.alert || error.message || 'Error de conexión';
          this.toastr.error(message, 'Error');
          return throwError(() => error);
        })
      );
  }

  // Actualizar producto
  updateProduct(id: number, product: ProductCreateRequest): Observable<ProductDetailDTO> {
    const payload = {
      productName: product.productName,
      productPrice: product.productPrice,
      recipeIDs: product.recipeIDs
    };

    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${id}`, payload)
      .pipe(
        map(response => {
          if (response.status && response.data) {
            this.toastr.success(response.alert, 'Éxito');
            const item = response.data;
            return {
              productID: item.productID,
              productName: item.productName,
              productPrice: item.productPrice,
              recipes: item.recipes?.map((recipe: any) => ({
                recipeID: recipe.recipeID,
                recipeName: recipe.recipeName
              })) || []
            };
          }
          throw new Error(response.alert || 'Error al actualizar producto');
        }),
        catchError(error => {
          const message = error.error?.alert || error.message || 'Error de conexión';
          this.toastr.error(message, 'Error');
          return throwError(() => error);
        })
      );
  }

  // Eliminar producto
  deleteProduct(id: number): Observable<void> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => {
          if (response.status) {
            this.toastr.success(response.alert, 'Éxito');
            return;
          }
          throw new Error(response.alert || 'Error al eliminar producto');
        }),
        catchError(error => {
          const message = error.error?.alert || error.message || 'Error de conexión';
          this.toastr.error(message, 'Error');
          return throwError(() => error);
        })
      );
  }

  // Obtener recetas disponibles
  getRecipes(): Observable<RecipeDetailDTO[]> {
    return this.http.get<ApiResponse<any[]>>(this.recipesUrl)
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

  private enrichProductWithDetails(product: ProductDetailDTO, availableRecipes: RecipeDetailDTO[]): ProductWithDetails {
    const recipeDetails = product.recipes.map(productRecipe => {
      const fullRecipe = availableRecipes.find(
        recipe => recipe.recipeID === productRecipe.recipeID
      );

      // Los productos no tienen stock físico, se elaboran al momento
      const canMake = true; // Siempre disponible para elaboración
      const maxPortions = 0; // No aplica stock para productos

      return {
        recipeID: productRecipe.recipeID,
        recipeName: productRecipe.recipeName,
        canMake,
        maxPortions,
        ingredients: fullRecipe?.ingredients.map(ing => ({
          ingredientName: ing.ingredientName,
          requiredQuantity: ing.requiredQuantity,
          ingredientUnit: ing.ingredientUnit,
          availableQuantity: 0 // Los productos no manejan stock de ingredientes directamente
        })) || []
      };
    });

    const canMake = recipeDetails.every(recipe => recipe.canMake);
    const maxPortions = 0; // Los productos no tienen stock, se elaboran al momento

    return {
      productID: product.productID,
      productName: product.productName,
      productPrice: product.productPrice,
      recipeDetails,
      canMake,
      maxPortions
    };
  }

  // Verificar si se puede hacer un producto
  canMakeProduct(product: ProductWithDetails): boolean {
    return product.canMake;
  }

  // Calcular cuántas porciones se pueden hacer
  getMaxPortions(product: ProductWithDetails): number {
    return product.maxPortions;
  }

  // Formatear precio
  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }
}