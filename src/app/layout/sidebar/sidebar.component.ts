import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface MenuItem {
  title: string;
  icon: string;
  route: string;
  roles?: string[];
  badge?: number;
  children?: MenuItem[];
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  standalone: false,
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {

  @Output() itemClick = new EventEmitter<void>();

  menuItems: MenuItem[] = [
    {
      title: 'Dashboard',
      icon: 'dashboard',
      route: '/dashboard'
    },
    {
      title: 'Órdenes',
      icon: 'receipt_long',
      route: '/orders',
      roles: ['Administrador', 'Vendedor'],
      badge: 3
    },
    {
      title: 'Gestión',
      icon: 'settings',
      route: '/management',
      roles: ['Administrador'],
      children: [
        {
          title: 'Proveedores',
          icon: 'business',
          route: '/providers'
        },
        {
          title: 'Ingredientes',
          icon: 'inventory_2',
          route: '/ingredients'
        },
        {
          title: 'Recetas',
          icon: 'menu_book',
          route: '/recipes'
        },
        {
          title: 'Productos',
          icon: 'fastfood',
          route: '/products'
        }
      ]
    },
    {
      title: 'Usuarios',
      icon: 'people',
      route: '/users',
      roles: ['Administrador']
    }
  ];

  expandedItems: Set<string> = new Set();

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {}

  navigateTo(route: string): void {
    this.router.navigate([route]);
    this.itemClick.emit();
  }

  toggleExpanded(title: string): void {
    if (this.expandedItems.has(title)) {
      this.expandedItems.delete(title);
    } else {
      this.expandedItems.add(title);
    }
  }

  isExpanded(title: string): boolean {
    return this.expandedItems.has(title);
  }

  isActive(route: string): boolean {
    return this.router.url.startsWith(route);
  }

  hasAccess(item: MenuItem): boolean {
    if (!item.roles || item.roles.length === 0) {
      return true;
    }
    
    const userRole = this.authService.getUserRole();
    return item.roles.includes(userRole);
  }
}