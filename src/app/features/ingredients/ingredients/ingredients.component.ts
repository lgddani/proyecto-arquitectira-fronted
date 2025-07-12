// src/app/features/ingredients/ingredients.component.ts
import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { Ingredient, IngredientWithProvider, Provider } from '../../../core/models';
import { IngredientsService } from '../../../core/services/ingredient.service';

export interface IngredientModalData {
  ingredient?: IngredientWithProvider;
  mode: 'create' | 'edit' | 'view';
}

@Component({
  selector: 'app-ingredients',
  standalone: false,
  templateUrl: './ingredients.component.html',
  styleUrls: ['./ingredients.component.css']
})
export class IngredientsComponent implements OnInit, OnDestroy {

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private destroy$ = new Subject<void>();
  
  // Configuración de la tabla
  displayedColumns: string[] = ['ingredientName', 'quantity', 'unit', 'provider', 'status', 'actions'];
  dataSource = new MatTableDataSource<IngredientWithProvider>();
  
  // Estado del componente
  loading = false;
  searchValue = '';
  
  // Modal
  showModal = false;
  modalData: IngredientModalData = { mode: 'create' };
  ingredientForm: FormGroup;
  modalLoading = false;

  // Datos auxiliares
  providers: Provider[] = [];
  units: string[] = [];

  constructor(
    private ingredientsService: IngredientsService,
    private fb: FormBuilder
  ) {
    this.ingredientForm = this.createForm();
    this.units = this.ingredientsService.getUnits();
  }

  ngOnInit(): void {
    this.loadData();
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
  // MÉTODOS DE CARGA DE DATOS
  // ========================================

  loadData(): void {
    this.loading = true;
    
    this.ingredientsService.getIngredientsWithProviders()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (ingredients) => {
          this.dataSource.data = ingredients;
        },
        error: (error) => {
          console.error('Error cargando ingredientes:', error);
        }
      });

    // Cargar proveedores para el formulario
    this.ingredientsService.getProviders()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (providers) => {
          this.providers = providers;
        },
        error: (error) => {
          console.error('Error cargando proveedores:', error);
        }
      });
  }

  // ========================================
  // MÉTODOS DE TABLA
  // ========================================

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
      ingredientName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100)
      ]],
      ingredientUnit: ['', [Validators.required]],
      ingredientQuantity: [0, [
        Validators.required,
        Validators.min(0)
      ]],
      minimumQuantity: [0, [
        Validators.required,
        Validators.min(0)
      ]],
      providerID: ['', [Validators.required]]
    });
  }

  openCreateModal(): void {
    this.modalData = { mode: 'create' };
    this.ingredientForm.reset();
    this.ingredientForm.patchValue({
      ingredientQuantity: 0,
      minimumQuantity: 0
    });
    this.showModal = true;
  }

  openEditModal(ingredient: IngredientWithProvider): void {
    this.modalData = { ingredient, mode: 'edit' };
    this.ingredientForm.patchValue({
      ingredientName: ingredient.ingredientName,
      ingredientUnit: ingredient.ingredientUnit,
      ingredientQuantity: ingredient.ingredientQuantity,
      minimumQuantity: ingredient.minimumQuantity,
      providerID: ingredient.providerID
    });
    this.showModal = true;
  }

  openViewModal(ingredient: IngredientWithProvider): void {
    this.modalData = { ingredient, mode: 'view' };
    this.ingredientForm.patchValue({
      ingredientName: ingredient.ingredientName,
      ingredientUnit: ingredient.ingredientUnit,
      ingredientQuantity: ingredient.ingredientQuantity,
      minimumQuantity: ingredient.minimumQuantity,
      providerID: ingredient.providerID
    });
    this.ingredientForm.disable();
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.ingredientForm.reset();
    this.ingredientForm.enable();
    this.modalData = { mode: 'create' };
  }

  onSubmit(): void {
    if (this.ingredientForm.invalid || this.modalData.mode === 'view') {
      if (this.modalData.mode !== 'view') {
        this.markFormGroupTouched();
      }
      return;
    }

    const formValue = this.ingredientForm.value;
    this.modalLoading = true;

    if (this.modalData.mode === 'create') {
      this.createIngredient(formValue);
    } else if (this.modalData.mode === 'edit' && this.modalData.ingredient) {
      this.updateIngredient(this.modalData.ingredient.ingredientID, formValue);
    }
  }

  private createIngredient(ingredientData: Omit<Ingredient, 'ingredientID'>): void {
    this.ingredientsService.createIngredient(ingredientData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.modalLoading = false)
      )
      .subscribe({
        next: () => {
          this.closeModal();
          this.loadData();
        },
        error: (error) => {
          console.error('Error creando ingrediente:', error);
        }
      });
  }

  private updateIngredient(id: number, ingredientData: Omit<Ingredient, 'ingredientID'>): void {
    this.ingredientsService.updateIngredient(id, ingredientData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.modalLoading = false)
      )
      .subscribe({
        next: () => {
          this.closeModal();
          this.loadData();
        },
        error: (error) => {
          console.error('Error actualizando ingrediente:', error);
        }
      });
  }

  deleteIngredient(ingredient: IngredientWithProvider): void {
    if (confirm(`¿Estás seguro de que deseas eliminar el ingrediente "${ingredient.ingredientName}"?`)) {
      this.ingredientsService.deleteIngredient(ingredient.ingredientID)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadData();
          },
          error: (error) => {
            console.error('Error eliminando ingrediente:', error);
          }
        });
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.ingredientForm.controls).forEach(key => {
      const control = this.ingredientForm.get(key);
      control?.markAsTouched();
    });
  }

  // ========================================
  // MÉTODOS DE UTILIDAD
  // ========================================

  getStockStatus(ingredient: IngredientWithProvider): 'good' | 'warning' | 'critical' {
    if (ingredient.ingredientQuantity <= 0) return 'critical';
    if (ingredient.ingredientQuantity <= ingredient.minimumQuantity) return 'warning';
    return 'good';
  }

  getStockStatusText(ingredient: IngredientWithProvider): string {
    const status = this.getStockStatus(ingredient);
    switch (status) {
      case 'good': return 'Stock suficiente';
      case 'warning': return 'Stock bajo';
      case 'critical': return 'Sin stock';
      default: return 'Sin stock';
    }
  }

  getStockStatusIcon(ingredient: IngredientWithProvider): string {
    const status = this.getStockStatus(ingredient);
    switch (status) {
      case 'good': return 'check_circle';
      case 'warning': return 'warning';
      case 'critical': return 'error';
      default: return 'error';
    }
  }

  getUnitLabel(unit: string): string {
    return this.ingredientsService.getUnitLabel(unit);
  }

  getModalTitle(): string {
    switch (this.modalData.mode) {
      case 'create': return 'Registrar Nuevo Ingrediente';
      case 'edit': return 'Editar Ingrediente';
      case 'view': return 'Ver Detalles del Ingrediente';
      default: return 'Ingrediente';
    }
  }

  getModalIcon(): string {
    switch (this.modalData.mode) {
      case 'create': return 'add_box';
      case 'edit': return 'edit';
      case 'view': return 'visibility';
      default: return 'inventory_2';
    }
  }

  isViewMode(): boolean {
    return this.modalData.mode === 'view';
  }

  // ========================================
  // GETTERS PARA VALIDACIONES
  // ========================================

  get ingredientName() { return this.ingredientForm.get('ingredientName'); }
  get ingredientUnit() { return this.ingredientForm.get('ingredientUnit'); }
  get ingredientQuantity() { return this.ingredientForm.get('ingredientQuantity'); }
  get minimumQuantity() { return this.ingredientForm.get('minimumQuantity'); }
  get providerID() { return this.ingredientForm.get('providerID'); }

  getIngredientNameError(): string {
    const control = this.ingredientName;
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'El nombre es obligatorio';
      if (control.errors['minlength']) return 'El nombre debe tener al menos 2 caracteres';
      if (control.errors['maxlength']) return 'El nombre no puede exceder 100 caracteres';
    }
    return '';
  }

  getQuantityError(): string {
    const control = this.ingredientQuantity;
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'La cantidad es obligatoria';
      if (control.errors['min']) return 'La cantidad debe ser mayor o igual a 0';
    }
    return '';
  }

  getMinimumQuantityError(): string {
    const control = this.minimumQuantity;
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'La cantidad mínima es obligatoria';
      if (control.errors['min']) return 'La cantidad mínima debe ser mayor o igual a 0';
    }
    return '';
  }

  getUnitError(): string {
    const control = this.ingredientUnit;
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'La unidad es obligatoria';
    }
    return '';
  }

  getProviderError(): string {
    const control = this.providerID;
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'El proveedor es obligatorio';
    }
    return '';
  }
}