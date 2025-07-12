// src/app/features/providers/providers.component.ts
import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { Provider } from '../../../core/models';
import { ProvidersService } from '../../../core/services/provider.service';

export interface ProviderModalData {
  provider?: Provider;
  mode: 'create' | 'edit' | 'view';
}

@Component({
  selector: 'app-providers',
  standalone: false,
  templateUrl: './providers.component.html',
  styleUrls: ['./providers.component.css']
})
export class ProvidersComponent implements OnInit, OnDestroy {

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private destroy$ = new Subject<void>();
  
  // Configuración de la tabla
  displayedColumns: string[] = ['providerName', 'providerPhone', 'actions'];
  dataSource = new MatTableDataSource<Provider>();
  
  // Estado del componente
  loading = false;
  searchValue = '';
  
  // Modal
  showModal = false;
  modalData: ProviderModalData = { mode: 'create' };
  providerForm: FormGroup;
  modalLoading = false;

  constructor(
    private providersService: ProvidersService,
    private fb: FormBuilder
  ) {
    this.providerForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadProviders();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  // ========================================
  // MÉTODOS DE TABLA
  // ========================================

  loadProviders(): void {
    this.loading = true;
    
    this.providersService.getProviders()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (providers) => {
          this.dataSource.data = providers;
        },
        error: (error) => {
          console.error('Error cargando proveedores:', error);
        }
      });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  clearFilter(): void {
    this.searchValue = '';
    this.dataSource.filter = '';
  }

  // ========================================
  // MÉTODOS DE MODAL
  // ========================================

  private createForm(): FormGroup {
    return this.fb.group({
      providerName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100)
      ]],
      providerPhone: ['', [
        Validators.pattern(/^[0-9+\-\s()]*$/),
        Validators.maxLength(20)
      ]]
    });
  }

  openCreateModal(): void {
    this.modalData = { mode: 'create' };
    this.providerForm.reset();
    this.showModal = true;
  }

  openEditModal(provider: Provider): void {
    this.modalData = { provider, mode: 'edit' };
    this.providerForm.patchValue({
      providerName: provider.providerName,
      providerPhone: provider.providerPhone || ''
    });
    this.showModal = true;
  }

  openViewModal(provider: Provider): void {
    this.modalData = { provider, mode: 'view' };
    this.providerForm.patchValue({
      providerName: provider.providerName,
      providerPhone: provider.providerPhone || ''
    });
    this.providerForm.disable();
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.providerForm.reset();
    this.providerForm.enable();
    this.modalData = { mode: 'create' };
  }

  onSubmit(): void {
    if (this.providerForm.invalid || this.modalData.mode === 'view') {
      if (this.modalData.mode !== 'view') {
        this.markFormGroupTouched();
      }
      return;
    }

    const formValue = this.providerForm.value;
    this.modalLoading = true;

    if (this.modalData.mode === 'create') {
      this.createProvider(formValue);
    } else if (this.modalData.mode === 'edit' && this.modalData.provider) {
      this.updateProvider(this.modalData.provider.providerID, formValue);
    }
  }

  private createProvider(providerData: Omit<Provider, 'providerID'>): void {
    this.providersService.createProvider(providerData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.modalLoading = false)
      )
      .subscribe({
        next: () => {
          this.closeModal();
          this.loadProviders();
        },
        error: (error) => {
          console.error('Error creando proveedor:', error);
        }
      });
  }

  private updateProvider(id: number, providerData: Omit<Provider, 'providerID'>): void {
    this.providersService.updateProvider(id, providerData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.modalLoading = false)
      )
      .subscribe({
        next: () => {
          this.closeModal();
          this.loadProviders();
        },
        error: (error) => {
          console.error('Error actualizando proveedor:', error);
        }
      });
  }

  deleteProvider(provider: Provider): void {
    if (confirm(`¿Estás seguro de que deseas eliminar el proveedor "${provider.providerName}"?`)) {
      this.providersService.deleteProvider(provider.providerID)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadProviders();
          },
          error: (error) => {
            console.error('Error eliminando proveedor:', error);
          }
        });
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.providerForm.controls).forEach(key => {
      const control = this.providerForm.get(key);
      control?.markAsTouched();
    });
  }

  // ========================================
  // GETTERS PARA VALIDACIONES
  // ========================================

  get providerName() { 
    return this.providerForm.get('providerName'); 
  }

  get providerPhone() { 
    return this.providerForm.get('providerPhone'); 
  }

  getModalTitle(): string {
    switch (this.modalData.mode) {
      case 'create': return 'Registrar Nuevo Proveedor';
      case 'edit': return 'Editar Proveedor';
      case 'view': return 'Ver Detalles del Proveedor';
      default: return 'Proveedor';
    }
  }

  getModalIcon(): string {
    switch (this.modalData.mode) {
      case 'create': return 'add_business';
      case 'edit': return 'edit';
      case 'view': return 'visibility';
      default: return 'business';
    }
  }

  isViewMode(): boolean {
    return this.modalData.mode === 'view';
  }

  getProviderNameError(): string {
    const control = this.providerName;
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'El nombre es obligatorio';
      if (control.errors['minlength']) return 'El nombre debe tener al menos 2 caracteres';
      if (control.errors['maxlength']) return 'El nombre no puede exceder 100 caracteres';
    }
    return '';
  }

  getProviderPhoneError(): string {
    const control = this.providerPhone;
    if (control?.errors && control.touched) {
      if (control.errors['pattern']) return 'Formato de teléfono inválido';
      if (control.errors['maxlength']) return 'El teléfono no puede exceder 20 caracteres';
    }
    return '';
  }
}