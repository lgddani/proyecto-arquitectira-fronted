import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models';

export interface DashboardStats {
  ordersToday: number;
  ordersThisWeek: number;
  ordersThisMonth: number;
  totalRevenue: number;
  revenueToday: number;
  revenueThisWeek: number;
  lowStockItems: number;
  totalProducts: number;
  totalIngredients: number;
  totalProviders: number;
}

export interface RecentOrder {
  orderID: number;
  createdAt: string;
  comment: string;
  total: number;
  products: Array<{
    productName: string;
    quantity: number;
  }>;
}

export interface LowStockAlert {
  ingredientID: number;
  ingredientName: string;
  currentQuantity: number;
  minimumQuantity: number;
  unit: string;
  providerName: string;
  urgencyLevel: 'low' | 'medium' | 'high';
}

export interface SalesChart {
  labels: string[];
  data: number[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Obtener estadísticas generales del dashboard
  getDashboardStats(): Observable<DashboardStats> {
    return forkJoin({
      orders: this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/orders`).pipe(
        catchError(() => of({ data: [] }))
      ),
      ingredients: this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/ingredients`).pipe(
        catchError(() => of({ data: [] }))
      ),
      products: this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/products`).pipe(
        catchError(() => of({ data: [] }))
      ),
      providers: this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/providers`).pipe(
        catchError(() => of({ data: [] }))
      )
    }).pipe(
      map(responses => {
        const orders = responses.orders.data || [];
        const ingredients = responses.ingredients.data || [];
        const products = responses.products.data || [];
        const providers = responses.providers.data || [];

        // Calcular estadísticas de órdenes por fecha
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const startOfWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const ordersToday = orders.filter(order => 
          new Date(order.createdAt) >= startOfDay
        );

        const ordersThisWeek = orders.filter(order => 
          new Date(order.createdAt) >= startOfWeek
        );

        const ordersThisMonth = orders.filter(order => 
          new Date(order.createdAt) >= startOfMonth
        );

        // Calcular ingresos
        const calculateRevenue = (ordersList: any[]) => {
          return ordersList.reduce((total, order) => {
            const orderTotal = order.products?.reduce((sum: number, product: any) => 
              sum + (product.subtotal || 0), 0) || 0;
            return total + orderTotal;
          }, 0);
        };

        const revenueToday = calculateRevenue(ordersToday);
        const revenueThisWeek = calculateRevenue(ordersThisWeek);
        const totalRevenue = calculateRevenue(orders);

        // Calcular ingredientes con stock bajo
        const lowStockItems = ingredients.filter((ingredient: any) => {
          const current = ingredient.ingredientQuantity || 0;
          const minimum = ingredient.minimumQuantity || 0;
          return current <= minimum;
        }).length;

        return {
          ordersToday: ordersToday.length,
          ordersThisWeek: ordersThisWeek.length,
          ordersThisMonth: ordersThisMonth.length,
          totalRevenue,
          revenueToday,
          revenueThisWeek,
          lowStockItems,
          totalProducts: products.length,
          totalIngredients: ingredients.length,
          totalProviders: providers.length
        };
      }),
      catchError(() => of({
        ordersToday: 0,
        ordersThisWeek: 0,
        ordersThisMonth: 0,
        totalRevenue: 0,
        revenueToday: 0,
        revenueThisWeek: 0,
        lowStockItems: 0,
        totalProducts: 0,
        totalIngredients: 0,
        totalProviders: 0
      }))
    );
  }

  // Obtener órdenes recientes
  getRecentOrders(limit: number = 5): Observable<RecentOrder[]> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/orders`).pipe(
      map(response => {
        const orders = response.data || [];
        return orders
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, limit)
          .map(order => ({
            orderID: order.orderID,
            createdAt: order.createdAt,
            comment: order.comment || 'Sin comentarios',
            total: order.products?.reduce((sum: number, product: any) => sum + (product.subtotal || 0), 0) || 0,
            products: order.products?.map((product: any) => ({
              productName: product.productName,
              quantity: product.quantity
            })) || []
          }));
      }),
      catchError(() => of([]))
    );
  }

  // Obtener alertas de stock bajo
  getLowStockAlerts(): Observable<LowStockAlert[]> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/ingredients`).pipe(
      map(response => {
        const ingredients = response.data || [];
        return ingredients
          .filter((ingredient: any) => {
            const current = ingredient.ingredientQuantity || 0;
            const minimum = ingredient.minimumQuantity || 0;
            return current <= minimum;
          })
          .map((ingredient: any) => {
            const current = ingredient.ingredientQuantity || 0;
            const minimum = ingredient.minimumQuantity || 0;
            const percentage = minimum > 0 ? (current / minimum) * 100 : 0;
            
            let urgencyLevel: 'low' | 'medium' | 'high' = 'low';
            if (percentage <= 25) urgencyLevel = 'high';
            else if (percentage <= 50) urgencyLevel = 'medium';

            return {
              ingredientID: ingredient.ingredientID,
              ingredientName: ingredient.ingredientName,
              currentQuantity: current,
              minimumQuantity: minimum,
              unit: ingredient.ingredientUnit,
              providerName: 'Proveedor',
              urgencyLevel
            };
          })
          .sort((a, b) => {
            const urgencyOrder = { high: 3, medium: 2, low: 1 };
            return urgencyOrder[b.urgencyLevel] - urgencyOrder[a.urgencyLevel];
          });
      }),
      catchError(() => of([]))
    );
  }

  // Obtener datos para gráfico de ventas de los últimos 7 días
  getSalesChart(): Observable<SalesChart> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/orders`).pipe(
      map(response => {
        const orders = response.data || [];
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          return date;
        });

        const labels = last7Days.map(date => 
          date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })
        );

        const data = last7Days.map(date => {
          const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
          const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
          
          const dayOrders = orders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= dayStart && orderDate < dayEnd;
          });

          return dayOrders.reduce((total, order) => {
            const orderTotal = order.products?.reduce((sum: number, product: any) => 
              sum + (product.subtotal || 0), 0) || 0;
            return total + orderTotal;
          }, 0);
        });

        return { labels, data };
      }),
      catchError(() => of({
        labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
        data: [0, 0, 0, 0, 0, 0, 0]
      }))
    );
  }

  // Obtener productos más vendidos
  getTopProducts(limit: number = 5): Observable<Array<{name: string, sales: number, revenue: number}>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/orders`).pipe(
      map(response => {
        const orders = response.data || [];
        const productSales: { [key: string]: { sales: number, revenue: number } } = {};

        orders.forEach(order => {
          order.products?.forEach((product: any) => {
            const name = product.productName;
            if (!productSales[name]) {
              productSales[name] = { sales: 0, revenue: 0 };
            }
            productSales[name].sales += product.quantity || 0;
            productSales[name].revenue += product.subtotal || 0;
          });
        });

        return Object.entries(productSales)
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.sales - a.sales)
          .slice(0, limit);
      }),
      catchError(() => of([]))
    );
  }
}