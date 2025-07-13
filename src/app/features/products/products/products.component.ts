// src/app/features/products/products/products.component.ts
import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { RecipeDetailDTO } from '../../../core/models';
import { ProductsService, ProductCreateRequest, ProductWithDetails } from '../../../core/services/products.service';

export interface ProductModalData {
  product?: ProductWithDetails;
  mode: 'create' | 'edit' | 'view';
}

@Component({
  selector: 'app-products',
  standalone: false,
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit, OnDestroy {

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private destroy$ = new Subject<void>();
  
  // Configuración de la tabla
  displayedColumns: string[] = ['productName', 'price', 'recipes', 'status', 'actions'];
  dataSource = new MatTableDataSource<ProductWithDetails>();
  
  // Estado del componente
  loading = false;
  searchValue = '';
  
  // Modal
  showModal = false;
  modalData: ProductModalData = { mode: 'create' };
  productForm: FormGroup;
  modalLoading = false;

  // Datos auxiliares
  availableRecipes: RecipeDetailDTO[] = [];

  constructor(
    private productsService: ProductsService,
    private fb: FormBuilder
  ) {
    this.productForm = this.createForm();
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
    
    this.productsService.getProductsWithDetails()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (products) => {
          this.dataSource.data = products;
        },
        error: (error) => {
          console.error('Error cargando productos:', error);
        }
      });

    // Cargar recetas para el formulario
    this.productsService.getRecipes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (recipes) => {
          this.availableRecipes = recipes;
        },
        error: (error) => {
          console.error('Error cargando recetas:', error);
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
  // MÉTODOS DE MODAL Y FORMULARIO
  // ========================================

  private createForm(): FormGroup {
    return this.fb.group({
      productName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100)
      ]],
      productPrice: [0, [
        Validators.required,
        Validators.min(0.01)
      ]],
      recipes: this.fb.array([])
    });
  }

  get recipes(): FormArray {
    return this.productForm.get('recipes') as FormArray;
  }

  getRecipeControls(): FormGroup[] {
    return this.recipes.controls as FormGroup[];
  }

  createRecipeForm(recipeData?: any): FormGroup {
    return this.fb.group({
      recipeID: [recipeData?.recipeID || '', Validators.required]
    });
  }

  addRecipe(): void {
    this.recipes.push(this.createRecipeForm());
  }

  removeRecipe(index: number): void {
    this.recipes.removeAt(index);
  }

  /**
   * Obtiene las recetas disponibles para un campo específico,
   * excluyendo las ya seleccionadas en otros campos
   */
  getAvailableRecipesForField(currentIndex: number): RecipeDetailDTO[] {
    // Obtener IDs de recetas ya seleccionadas en otros campos
    const selectedRecipeIds = this.getRecipeControls()
      .map((control, index) => {
        // No excluir el campo actual para permitir que mantenga su valor
        if (index === currentIndex) return null;
        return control.get('recipeID')?.value;
      })
      .filter(id => id !== null && id !== undefined && id !== '');

    // Filtrar recetas disponibles
    return this.availableRecipes.filter(recipe => 
      !selectedRecipeIds.includes(recipe.recipeID)
    );
  }

  openCreateModal(): void {
    this.modalData = { mode: 'create' };
    this.productForm.reset();
    this.recipes.clear();
    this.addRecipe(); // Agregar al menos una receta
    this.productForm.patchValue({
      productPrice: 0
    });
    this.showModal = true;
  }

  openEditModal(product: ProductWithDetails): void {
    this.modalData = { product, mode: 'edit' };
    this.productForm.patchValue({
      productName: product.productName,
      productPrice: product.productPrice
    });
    
    // Limpiar y llenar recetas
    this.recipes.clear();
    product.recipeDetails.forEach(recipe => {
      this.recipes.push(this.createRecipeForm({
        recipeID: recipe.recipeID
      }));
    });
    
    this.showModal = true;
  }

  openViewModal(product: ProductWithDetails): void {
    this.modalData = { product, mode: 'view' };
    this.productForm.patchValue({
      productName: product.productName,
      productPrice: product.productPrice
    });
    
    this.recipes.clear();
    product.recipeDetails.forEach(recipe => {
      this.recipes.push(this.createRecipeForm({
        recipeID: recipe.recipeID
      }));
    });
    
    this.productForm.disable();
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.productForm.reset();
    this.productForm.enable();
    this.recipes.clear();
    this.modalData = { mode: 'create' };
  }

  onSubmit(): void {
    if (this.productForm.invalid || this.modalData.mode === 'view') {
      if (this.modalData.mode !== 'view') {
        this.markFormGroupTouched();
      }
      return;
    }

    const formValue = this.productForm.value;
    const productData: ProductCreateRequest = {
      productName: formValue.productName,
      productPrice: formValue.productPrice,
      recipeIDs: formValue.recipes.map((r: any) => r.recipeID)
    };

    this.modalLoading = true;

    if (this.modalData.mode === 'create') {
      this.createProduct(productData);
    } else if (this.modalData.mode === 'edit' && this.modalData.product) {
      this.updateProduct(this.modalData.product.productID, productData);
    }
  }

  private createProduct(productData: ProductCreateRequest): void {
    this.productsService.createProduct(productData)
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
          console.error('Error creando producto:', error);
        }
      });
  }

  private updateProduct(id: number, productData: ProductCreateRequest): void {
    this.productsService.updateProduct(id, productData)
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
          console.error('Error actualizando producto:', error);
        }
      });
  }

  deleteProduct(product: ProductWithDetails): void {
    if (confirm(`¿Estás seguro de que deseas eliminar el producto "${product.productName}"?`)) {
      this.productsService.deleteProduct(product.productID)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadData();
          },
          error: (error) => {
            console.error('Error eliminando producto:', error);
          }
        });
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.productForm.controls).forEach(key => {
      const control = this.productForm.get(key);
      control?.markAsTouched();
    });

    this.getRecipeControls().forEach(group => {
      Object.keys(group.controls).forEach(key => {
        group.get(key)?.markAsTouched();
      });
    });
  }

  // ========================================
  // MÉTODOS DE UTILIDAD
  // ========================================

  getRecipeName(recipeID: number): string {
    const recipe = this.availableRecipes.find(r => r.recipeID === recipeID);
    return recipe ? recipe.recipeName : 'Receta no encontrada';
  }

  canMakeProduct(product: ProductWithDetails): boolean {
    return this.productsService.canMakeProduct(product);
  }

  getMaxPortions(product: ProductWithDetails): number {
    return this.productsService.getMaxPortions(product);
  }

  getProductStatus(product: ProductWithDetails): 'available' | 'limited' | 'unavailable' {
    // Los productos siempre están disponibles para elaboración
    // El estado se basa en la disponibilidad de las recetas
    return product.canMake ? 'available' : 'unavailable';
  }

  getProductStatusText(product: ProductWithDetails): string {
    return product.canMake ? 'Disponible para elaborar' : 'Recetas no disponibles';
  }

  getProductStatusIcon(product: ProductWithDetails): string {
    const status = this.getProductStatus(product);
    switch (status) {
      case 'available': return 'check_circle';
      case 'limited': return 'warning';
      case 'unavailable': return 'error';
      default: return 'error';
    }
  }

  formatPrice(price: number): string {
    return this.productsService.formatPrice(price);
  }

  getModalTitle(): string {
    switch (this.modalData.mode) {
      case 'create': return 'Crear Nuevo Producto';
      case 'edit': return 'Editar Producto';
      case 'view': return 'Ver Detalles del Producto';
      default: return 'Producto';
    }
  }

  getModalIcon(): string {
    switch (this.modalData.mode) {
      case 'create': return 'add_shopping_cart';
      case 'edit': return 'edit';
      case 'view': return 'visibility';
      default: return 'fastfood';
    }
  }

  isViewMode(): boolean {
    return this.modalData.mode === 'view';
  }

  // ========================================
  // GETTERS PARA VALIDACIONES
  // ========================================

  get productName() { return this.productForm.get('productName'); }
  get productPrice() { return this.productForm.get('productPrice'); }

  getProductNameError(): string {
    const control = this.productName;
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'El nombre es obligatorio';
      if (control.errors['minlength']) return 'El nombre debe tener al menos 2 caracteres';
      if (control.errors['maxlength']) return 'El nombre no puede exceder 100 caracteres';
    }
    return '';
  }

  getProductPriceError(): string {
    const control = this.productPrice;
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'El precio es obligatorio';
      if (control.errors['min']) return 'El precio debe ser mayor a 0';
    }
    return '';
  }

  getRecipeError(index: number, field: string): string {
    const control = this.recipes.at(index).get(field);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return field === 'recipeID' ? 'Selecciona una receta' : 'Campo obligatorio';
      }
    }
    return '';
  }
}