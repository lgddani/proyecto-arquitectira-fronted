// src/app/core/services/orders.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models';

export interface OrderCreateRequest {
  comment: string;
  products: {
    productID: number;
    quantity: number;
  }[];
}

export interface OrderDetailDTO {
  orderID: number;
  createdAt: string;
  comment: string;
  products: OrderProductDetailDTO[];
}

export interface OrderProductDetailDTO {
  productID: number;
  productName: string;
  productPrice: number;
  quantity: number;
  subtotal: number;
}

export interface ProductForOrder {
  productID: number;
  productName: string;
  productPrice: number;
  available: boolean;
  maxQuantity?: number;
}

// Nueva interfaz para manejar errores de ingredientes
export interface InsufficientIngredientsError {
  alert: string;
  status: boolean;
  messages: string[];
  data: null;
}

@Injectable({
  providedIn: 'root'
})
export class OrdersService {

  private apiUrl = `${environment.apiUrl}/orders`;
  private productsUrl = `${environment.apiUrl}/products`;

  constructor(
    private http: HttpClient,
    private toastr: ToastrService
  ) {}

  // Crear nueva orden
  createOrder(orderData: OrderCreateRequest): Observable<OrderDetailDTO> {
    return this.http.post<ApiResponse<OrderDetailDTO>>(this.apiUrl, orderData)
      .pipe(
        map(response => {
          if (response.status && response.data) {
            this.toastr.success(response.alert, 'Éxito');
            return response.data;
          }
          throw new Error(response.alert || 'Error al crear orden');
        }),
        catchError(error => {
          console.error('Error en createOrder:', error);
          
          // Verificar si es un error de ingredientes insuficientes
          if (error.error && error.error.messages && Array.isArray(error.error.messages)) {
            this.showInsufficientIngredientsError(error.error);
          } else {
            // Error genérico
            const message = error.error?.alert || error.message || 'Error de conexión';
            this.toastr.error(message, 'Error');
          }
          
          return throwError(() => error);
        })
      );
  }

  // Método privado para mostrar errores de ingredientes insuficientes
  private showInsufficientIngredientsError(errorResponse: InsufficientIngredientsError): void {
    const title = errorResponse.alert || 'Ingredientes Insuficientes';
    
    // Mostrar el título principal
    this.toastr.error(title, 'Error al Crear Orden', {
      timeOut: 8000,
      extendedTimeOut: 2000,
      closeButton: true,
      progressBar: true
    });

    // Mostrar cada ingrediente insuficiente como una notificación separada
    errorResponse.messages.forEach((message, index) => {
      setTimeout(() => {
        this.toastr.warning(message, 'Ingrediente Faltante', {
          timeOut: 6000,
          extendedTimeOut: 2000,
          closeButton: true,
          progressBar: true
        });
      }, index * 1000); // Escalonar las notificaciones cada segundo
    });
  }

  // Obtener todas las órdenes
  getOrders(): Observable<OrderDetailDTO[]> {
    return this.http.get<ApiResponse<OrderDetailDTO[]>>(this.apiUrl)
      .pipe(
        map(response => {
          if (response.status && response.data) {
            return response.data;
          }
          throw new Error(response.alert || 'Error al obtener órdenes');
        }),
        catchError(error => {
          const message = error.error?.alert || error.message || 'Error de conexión';
          this.toastr.error(message, 'Error');
          return throwError(() => error);
        })
      );
  }

  // Obtener una orden por ID
  getOrder(orderID: number): Observable<OrderDetailDTO> {
    return this.http.get<ApiResponse<OrderDetailDTO>>(`${this.apiUrl}/${orderID}`)
      .pipe(
        map(response => {
          if (response.status && response.data) {
            return response.data;
          }
          throw new Error(response.alert || 'Error al obtener orden');
        }),
        catchError(error => {
          const message = error.error?.alert || error.message || 'Error de conexión';
          this.toastr.error(message, 'Error');
          return throwError(() => error);
        })
      );
  }

  // Obtener productos disponibles para órdenes
  getAvailableProducts(): Observable<ProductForOrder[]> {
    return this.http.get<ApiResponse<any[]>>(this.productsUrl)
      .pipe(
        map(response => {
          if (response.status && response.data) {
            return response.data.map(product => ({
              productID: product.productID,
              productName: product.productName,
              productPrice: product.productPrice,
              available: true, // Los productos siempre están disponibles para elaborar
              maxQuantity: 99 // Cantidad máxima por orden
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

  // Calcular total de una orden
  calculateOrderTotal(products: { product: ProductForOrder, quantity: number }[]): number {
    return products.reduce((total, item) => {
      return total + (item.product.productPrice * item.quantity);
    }, 0);
  }

  // Formatear precio
  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }

  // Formatear fecha
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Método auxiliar para extraer mensajes de error de ingredientes
  getInsufficientIngredientsMessages(error: any): string[] {
    if (error?.error?.messages && Array.isArray(error.error.messages)) {
      return error.error.messages;
    }
    return [];
  }

  // Método auxiliar para verificar si un error es de ingredientes insuficientes
  isInsufficientIngredientsError(error: any): boolean {
    return error?.error?.messages && Array.isArray(error.error.messages) && error.error.messages.length > 0;
  }
}