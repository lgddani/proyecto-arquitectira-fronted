import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: false,
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent implements OnInit {

  @ViewChild('drawer') drawer!: MatSidenav;
  
  isHandset = false;

  constructor(
    private breakpointObserver: BreakpointObserver,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.breakpointObserver.observe(Breakpoints.Handset)
      .subscribe(result => {
        this.isHandset = result.matches;
      });
  }

  get sidenavMode(): 'over' | 'side' {
    return this.isHandset ? 'over' : 'side';
  }

  get sidenavOpened(): boolean {
    return !this.isHandset;
  }

  toggleSidenav(): void {
    this.drawer.toggle();
  }

  closeSidenavOnMobile(): void {
    if (this.isHandset && this.drawer) {
      this.drawer.close();
    }
  }
}