import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  standalone: false,
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  @Input() isHandset: boolean | null = false;
  @Output() menuToggle = new EventEmitter<void>();

  currentUser: User | null = null;
  currentTime = new Date();

  constructor(public authService: AuthService) {
    // Actualizar tiempo cada minuto
    setInterval(() => {
      this.currentTime = new Date();
    }, 60000);
  }

  ngOnInit(): void {
    // Suscribirse a cambios del usuario
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  onMenuToggle(): void {
    this.menuToggle.emit();
  }

  onLogout(): void {
    this.authService.logout();
  }

  getUserInitials(): string {
    if (!this.currentUser?.userName) return 'U';
    
    const names = this.currentUser.userName.split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  }

  getRoleDisplayName(): string {
    return this.authService.getUserRole() || 'Usuario';
  }
}