import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  standalone: false,
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  currentUser: User | null = null;
  currentTime = new Date();

  // Stats de ejemplo (más tarde se conectarán con APIs reales)
  stats = {
    ordersToday: 0,
    lowStockItems: 0,
    totalProducts: 0,
    totalRevenue: 0
  };

  constructor(
    private authService: AuthService
  ) {
    // Actualizar tiempo cada minuto
    setInterval(() => {
      this.currentTime = new Date();
    }, 60000);
  }

  ngOnInit(): void {
    // Obtener usuario actual
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // Cargar stats (simular por ahora)
    this.loadDashboardStats();
  }

  private loadDashboardStats(): void {
    this.stats = {
      ordersToday: 12,
      lowStockItems: 3,
      totalProducts: 15,
      totalRevenue: 450.75
    };
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }

  getUserRole(): string {
    return this.authService.getUserRole();
  }
}