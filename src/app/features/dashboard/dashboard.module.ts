import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';

// Components
import { DashboardComponent } from './dashboard/dashboard.component';

const routes: Routes = [
  { 
    path: '', 
    component: DashboardComponent 
  }
];

@NgModule({
  declarations: [
    DashboardComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    
    // Angular Material
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatGridListModule
  ]
})
export class DashboardModule { }