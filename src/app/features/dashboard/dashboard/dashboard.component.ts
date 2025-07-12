import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, interval } from 'rxjs';
import { takeUntil, switchMap, startWith } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardService, DashboardStats, RecentOrder, LowStockAlert, SalesChart } from '../../../core/services/dashboard.service';
import { User } from '../../../core/models';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();
  
  // Estado del componente
  loading = true;
  currentUser: User | null = null;
  currentTime = new Date();
  
  // Datos del dashboard
  stats: DashboardStats = {
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
  };
  
  recentOrders: RecentOrder[] = [];
  lowStockAlerts: LowStockAlert[] = [];
  salesChart: SalesChart = { labels: [], data: [] };
  topProducts: Array<{name: string, sales: number, revenue: number}> = [];

  // Configuración de colores para alertas
  alertColors = {
    high: '#f44336',    // Rojo
    medium: '#ff9800',  // Naranja
    low: '#ffc107'      // Amarillo
  };

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private router: Router,
    private toastr: ToastrService
  ) {
    // Actualizar tiempo cada minuto
    interval(60000).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentTime = new Date();
    });
  }

  ngOnInit(): void {
    // Obtener usuario actual
    this.authService.currentUser$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(user => {
      this.currentUser = user;
    });

    // Cargar datos del dashboard
    this.loadDashboardData();

    // Configurar actualización automática cada 5 minutos
    interval(300000).pipe(
      takeUntil(this.destroy$),
      startWith(0),
      switchMap(() => this.dashboardService.getDashboardStats())
    ).subscribe({
      next: (stats) => {
        // Solo actualizar stats, no todo el dashboard
        this.stats = stats;
      },
      error: (error) => {
        console.error('Error actualizando estadísticas:', error);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDashboardData(): void {
    this.loading = true;

    // Cargar todas las secciones del dashboard
    Promise.all([
      this.dashboardService.getDashboardStats().toPromise(),
      this.dashboardService.getRecentOrders(5).toPromise(),
      this.dashboardService.getLowStockAlerts().toPromise(),
      this.dashboardService.getSalesChart().toPromise(),
      this.dashboardService.getTopProducts(5).toPromise()
    ]).then(([stats, orders, alerts, chart, products]) => {
      this.stats = stats || this.stats;
      this.recentOrders = orders || [];
      this.lowStockAlerts = alerts || [];
      this.salesChart = chart || { labels: [], data: [] };
      this.topProducts = products || [];
      
      // Mostrar notificación si hay alertas críticas
      const criticalAlerts = this.lowStockAlerts.filter(alert => alert.urgencyLevel === 'high');
      if (criticalAlerts.length > 0) {
        this.toastr.warning(
          `Tienes ${criticalAlerts.length} ingrediente(s) con stock crítico`,
          'Alerta de Inventario',
          { timeOut: 8000 }
        );
      }
    }).catch(error => {
      console.error('Error cargando dashboard:', error);
      this.toastr.error('Error al cargar los datos del dashboard', 'Error');
    }).finally(() => {
      this.loading = false;
    });
  }

  // Métodos de utilidad
  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }

  getUserRole(): string {
    return this.authService.getUserRole();
  }

  isAdmin(): boolean {
    return this.getUserRole() === 'Administrador';
  }

  isSeller(): boolean {
    return this.getUserRole() === 'Vendedor';
  }

  // Métodos de navegación
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  createNewOrder(): void {
    this.router.navigate(['/orders/new']);
  }

  viewAllOrders(): void {
    this.router.navigate(['/orders']);
  }

  manageInventory(): void {
    this.router.navigate(['/ingredients']);
  }

  viewLowStockDetails(): void {
    this.router.navigate(['/ingredients'], { 
      queryParams: { filter: 'low-stock' } 
    });
  }

  // Métodos para formateo
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getAlertClass(urgency: string): string {
    const classes = {
      high: 'alert-critical',
      medium: 'alert-warning',
      low: 'alert-info'
    };
    return classes[urgency as keyof typeof classes] || 'alert-info';
  }

  getStockPercentage(current: number, minimum: number): number {
    if (minimum === 0) return 100;
    return Math.max(0, Math.min(100, (current / minimum) * 100));
  }

  // Método para refrescar datos manualmente
  refreshDashboard(): void {
    this.loadDashboardData();
    this.toastr.info('Dashboard actualizado', 'Información');
  }

  // Método para obtener el saludo personalizado según la hora y datos
  getPersonalizedGreeting(): string {
    const baseGreeting = this.getGreeting();
    const userName = this.currentUser?.userName || 'Usuario';
    
    if (this.stats.ordersToday > 0) {
      return `${baseGreeting}, ${userName}! 🎉 Ya llevas ${this.stats.ordersToday} orden(es) hoy`;
    } else {
      return `${baseGreeting}, ${userName}! 🧇 ¡Listo para un gran día!`;
    }
  }

  // Métodos para estadísticas comparativas
  getRevenueGrowth(): { percentage: number, isPositive: boolean } {
    const todayRevenue = this.stats.revenueToday;
    const weekRevenue = this.stats.revenueThisWeek;
    const avgDailyRevenue = weekRevenue / 7;
    
    if (avgDailyRevenue === 0) return { percentage: 0, isPositive: true };
    
    const growth = ((todayRevenue - avgDailyRevenue) / avgDailyRevenue) * 100;
    return {
      percentage: Math.abs(Math.round(growth)),
      isPositive: growth >= 0
    };
  }

  getOrdersGrowth(): { percentage: number, isPositive: boolean } {
    const todayOrders = this.stats.ordersToday;
    const weekOrders = this.stats.ordersThisWeek;
    const avgDailyOrders = weekOrders / 7;
    
    if (avgDailyOrders === 0) return { percentage: 0, isPositive: true };
    
    const growth = ((todayOrders - avgDailyOrders) / avgDailyOrders) * 100;
    return {
      percentage: Math.abs(Math.round(growth)),
      isPositive: growth >= 0
    };
  }
}