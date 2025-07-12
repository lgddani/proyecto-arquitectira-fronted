// src/app/features/recipes/recipes.component.ts
import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { IngredientWithProvider } from '../../../core/models';
import { RecipesService, RecipeCreateRequest, RecipeWithDetails  } from '../../../core/services/recipes.service';

export interface RecipeModalData {
  recipe?: RecipeWithDetails;
  mode: 'create' | 'edit' | 'view';
}

@Component({
  selector: 'app-recipes',
  standalone: false,
  templateUrl: './recipes.component.html',
  styleUrls: ['./recipes.component.css']
})
export class RecipesComponent implements OnInit, OnDestroy {

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private destroy$ = new Subject<void>();
  
  // Configuración de la tabla
  displayedColumns: string[] = ['recipeName', 'ingredients', 'portions', 'status', 'actions'];
  dataSource = new MatTableDataSource<RecipeWithDetails>();
  
  // Estado del componente
  loading = false;
  searchValue = '';
  
  // Modal
  showModal = false;
  modalData: RecipeModalData = { mode: 'create' };
  recipeForm: FormGroup;
  modalLoading = false;

  // Datos auxiliares
  availableIngredients: IngredientWithProvider[] = [];

  constructor(
    private recipesService: RecipesService,
    private fb: FormBuilder
  ) {
    this.recipeForm = this.createForm();
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
    
    this.recipesService.getRecipesWithDetails()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (recipes) => {
          this.dataSource.data = recipes;
        },
        error: (error) => {
          console.error('Error cargando recetas:', error);
        }
      });

    // Cargar ingredientes para el formulario
    this.recipesService.getIngredients()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (ingredients) => {
          this.availableIngredients = ingredients;
        },
        error: (error) => {
          console.error('Error cargando ingredientes:', error);
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
      recipeName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100)
      ]],
      ingredients: this.fb.array([])
    });
  }

  get ingredients(): FormArray {
    return this.recipeForm.get('ingredients') as FormArray;
  }

  // NUEVO MÉTODO PARA CORREGIR EL ERROR
  getIngredientControls(): FormGroup[] {
    return this.ingredients.controls as FormGroup[];
  }

  createIngredientForm(ingredientData?: any): FormGroup {
    return this.fb.group({
      ingredientID: [ingredientData?.ingredientID || '', Validators.required],
      requiredQuantity: [ingredientData?.requiredQuantity || 0, [Validators.required, Validators.min(0.01)]]
    });
  }

  addIngredient(): void {
    this.ingredients.push(this.createIngredientForm());
  }

  removeIngredient(index: number): void {
    this.ingredients.removeAt(index);
  }

  openCreateModal(): void {
    this.modalData = { mode: 'create' };
    this.recipeForm.reset();
    this.ingredients.clear();
    this.addIngredient(); // Agregar al menos un ingrediente
    this.showModal = true;
  }

  openEditModal(recipe: RecipeWithDetails): void {
    this.modalData = { recipe, mode: 'edit' };
    this.recipeForm.patchValue({
      recipeName: recipe.recipeName
    });
    
    // Limpiar y llenar ingredientes
    this.ingredients.clear();
    recipe.ingredientDetails.forEach(ingredient => {
      this.ingredients.push(this.createIngredientForm({
        ingredientID: ingredient.ingredientID,
        requiredQuantity: ingredient.requiredQuantity
      }));
    });
    
    this.showModal = true;
  }

  openViewModal(recipe: RecipeWithDetails): void {
    this.modalData = { recipe, mode: 'view' };
    this.recipeForm.patchValue({
      recipeName: recipe.recipeName
    });
    
    this.ingredients.clear();
    recipe.ingredientDetails.forEach(ingredient => {
      this.ingredients.push(this.createIngredientForm({
        ingredientID: ingredient.ingredientID,
        requiredQuantity: ingredient.requiredQuantity
      }));
    });
    
    this.recipeForm.disable();
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.recipeForm.reset();
    this.recipeForm.enable();
    this.ingredients.clear();
    this.modalData = { mode: 'create' };
  }

  onSubmit(): void {
    if (this.recipeForm.invalid || this.modalData.mode === 'view') {
      if (this.modalData.mode !== 'view') {
        this.markFormGroupTouched();
      }
      return;
    }

    const formValue = this.recipeForm.value;
    const recipeData: RecipeCreateRequest = {
      recipeName: formValue.recipeName,
      ingredients: formValue.ingredients
    };

    this.modalLoading = true;

    if (this.modalData.mode === 'create') {
      this.createRecipe(recipeData);
    } else if (this.modalData.mode === 'edit' && this.modalData.recipe) {
      this.updateRecipe(this.modalData.recipe.recipeID, recipeData);
    }
  }

  private createRecipe(recipeData: RecipeCreateRequest): void {
    this.recipesService.createRecipe(recipeData)
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
          console.error('Error creando receta:', error);
        }
      });
  }

  private updateRecipe(id: number, recipeData: RecipeCreateRequest): void {
    this.recipesService.updateRecipe(id, recipeData)
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
          console.error('Error actualizando receta:', error);
        }
      });
  }

  deleteRecipe(recipe: RecipeWithDetails): void {
    if (confirm(`¿Estás seguro de que deseas eliminar la receta "${recipe.recipeName}"?`)) {
      this.recipesService.deleteRecipe(recipe.recipeID)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadData();
          },
          error: (error) => {
            console.error('Error eliminando receta:', error);
          }
        });
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.recipeForm.controls).forEach(key => {
      const control = this.recipeForm.get(key);
      control?.markAsTouched();
    });

    this.getIngredientControls().forEach(group => {
      Object.keys(group.controls).forEach(key => {
        group.get(key)?.markAsTouched();
      });
    });
  }

  // ========================================
  // MÉTODOS DE UTILIDAD
  // ========================================

  getIngredientName(ingredientID: number): string {
    const ingredient = this.availableIngredients.find(ing => ing.ingredientID === ingredientID);
    return ingredient ? ingredient.ingredientName : 'Ingrediente no encontrado';
  }

  getIngredientUnit(ingredientID: number): string {
    const ingredient = this.availableIngredients.find(ing => ing.ingredientID === ingredientID);
    return ingredient ? ingredient.ingredientUnit : '';
  }

  canMakeRecipe(recipe: RecipeWithDetails): boolean {
    return this.recipesService.canMakeRecipe(recipe);
  }

  getMaxPortions(recipe: RecipeWithDetails): number {
    return this.recipesService.getMaxPortions(recipe);
  }

  getRecipeStatus(recipe: RecipeWithDetails): 'available' | 'limited' | 'unavailable' {
    const maxPortions = this.getMaxPortions(recipe);
    if (maxPortions <= 0) return 'unavailable';
    if (maxPortions < 5) return 'limited';
    return 'available';
  }

  getRecipeStatusText(recipe: RecipeWithDetails): string {
    const status = this.getRecipeStatus(recipe);
    switch (status) {
      case 'available': return 'Disponible';
      case 'limited': return 'Stock limitado';
      case 'unavailable': return 'No disponible';
      default: return 'No disponible';
    }
  }

  getRecipeStatusIcon(recipe: RecipeWithDetails): string {
    const status = this.getRecipeStatus(recipe);
    switch (status) {
      case 'available': return 'check_circle';
      case 'limited': return 'warning';
      case 'unavailable': return 'error';
      default: return 'error';
    }
  }

  getModalTitle(): string {
    switch (this.modalData.mode) {
      case 'create': return 'Crear Nueva Receta';
      case 'edit': return 'Editar Receta';
      case 'view': return 'Ver Detalles de la Receta';
      default: return 'Receta';
    }
  }

  getModalIcon(): string {
    switch (this.modalData.mode) {
      case 'create': return 'add_circle';
      case 'edit': return 'edit';
      case 'view': return 'visibility';
      default: return 'menu_book';
    }
  }

  isViewMode(): boolean {
    return this.modalData.mode === 'view';
  }

  // ========================================
  // GETTERS PARA VALIDACIONES
  // ========================================

  get recipeName() { return this.recipeForm.get('recipeName'); }

  getRecipeNameError(): string {
    const control = this.recipeName;
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'El nombre es obligatorio';
      if (control.errors['minlength']) return 'El nombre debe tener al menos 2 caracteres';
      if (control.errors['maxlength']) return 'El nombre no puede exceder 100 caracteres';
    }
    return '';
  }

  getIngredientError(index: number, field: string): string {
    const control = this.ingredients.at(index).get(field);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return field === 'ingredientID' ? 'Selecciona un ingrediente' : 'La cantidad es obligatoria';
      }
      if (control.errors['min']) return 'La cantidad debe ser mayor a 0';
    }
    return '';
  }
}