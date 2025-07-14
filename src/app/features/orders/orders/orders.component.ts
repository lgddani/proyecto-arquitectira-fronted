// src/app/features/orders/orders/orders.component.ts
import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { 
  OrdersService, 
  OrderDetailDTO, 
  OrderCreateRequest, 
  ProductForOrder 
} from '../../../core/services/orders.service';

export interface OrderModalData {
  order?: OrderDetailDTO;
  mode: 'create' | 'view';
}

export interface IngredientsErrorData {
  title: string;
  messages: string[];
}

@Component({
  selector: 'app-orders',
  standalone: false,
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})
export class OrdersComponent implements OnInit, OnDestroy {

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private destroy$ = new Subject<void>();
  
  // Configuración de la tabla
  displayedColumns: string[] = ['orderID', 'createdAt', 'products', 'total', 'comment', 'actions'];
  dataSource = new MatTableDataSource<OrderDetailDTO>();
  
  // Estado del componente
  loading = false;
  searchValue = '';
  
  // Modal principal
  showModal = false;
  modalData: OrderModalData = { mode: 'create' };
  orderForm: FormGroup;
  modalLoading = false;

  // Modal de ingredientes insuficientes
  showIngredientsErrorModal = false;
  ingredientsErrorData: IngredientsErrorData = { title: '', messages: [] };

  // Datos auxiliares
  availableProducts: ProductForOrder[] = [];

  constructor(
    private ordersService: OrdersService,
    private fb: FormBuilder
  ) {
    this.orderForm = this.createForm();
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
    
    this.ordersService.getOrders()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (orders) => {
          this.dataSource.data = orders;
        },
        error: (error) => {
          console.error('Error cargando órdenes:', error);
        }
      });

    // Cargar productos para el formulario
    this.ordersService.getAvailableProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.availableProducts = products;
        },
        error: (error) => {
          console.error('Error cargando productos:', error);
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
      comment: [''],
      products: this.fb.array([])
    });
  }

  get products(): FormArray {
    return this.orderForm.get('products') as FormArray;
  }

  getProductControls(): FormGroup[] {
    return this.products.controls as FormGroup[];
  }

  createProductForm(productData?: any): FormGroup {
    return this.fb.group({
      productID: [productData?.productID || '', Validators.required],
      quantity: [productData?.quantity || 1, [Validators.required, Validators.min(1), Validators.max(99)]]
    });
  }

  addProduct(): void {
    this.products.push(this.createProductForm());
  }

  removeProduct(index: number): void {
    this.products.removeAt(index);
  }

  /**
   * Obtiene los productos disponibles para un campo específico,
   * excluyendo los ya seleccionados en otros campos
   */
  getAvailableProductsForField(currentIndex: number): ProductForOrder[] {
    // Obtener IDs de productos ya seleccionados en otros campos
    const selectedProductIds = this.getProductControls()
      .map((control, index) => {
        // No excluir el campo actual para permitir que mantenga su valor
        if (index === currentIndex) return null;
        return control.get('productID')?.value;
      })
      .filter(id => id !== null && id !== undefined && id !== '');

    // Filtrar productos disponibles
    return this.availableProducts.filter(product => 
      !selectedProductIds.includes(product.productID)
    );
  }

  openCreateModal(): void {
    this.modalData = { mode: 'create' };
    this.orderForm.reset();
    this.products.clear();
    this.addProduct(); // Agregar al menos un producto
    this.showModal = true;
  }

  openViewModal(order: OrderDetailDTO): void {
    this.modalData = { order, mode: 'view' };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.orderForm.reset();
    this.products.clear();
    this.modalData = { mode: 'create' };
  }

  // ========================================
  // MÉTODOS DE MODAL DE INGREDIENTES
  // ========================================

  openIngredientsErrorModal(title: string, messages: string[]): void {
    this.ingredientsErrorData = { title, messages };
    this.showIngredientsErrorModal = true;
  }

  closeIngredientsErrorModal(): void {
    this.showIngredientsErrorModal = false;
    this.ingredientsErrorData = { title: '', messages: [] };
  }

  onSubmit(): void {
    if (this.orderForm.invalid || this.modalData.mode === 'view') {
      if (this.modalData.mode !== 'view') {
        this.markFormGroupTouched();
      }
      return;
    }

    const formValue = this.orderForm.value;
    const orderData: OrderCreateRequest = {
      comment: formValue.comment || '',
      products: formValue.products
    };

    this.modalLoading = true;
    this.createOrder(orderData);
  }

  private createOrder(orderData: OrderCreateRequest): void {
    this.ordersService.createOrder(orderData)
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
          console.error('Error creando orden:', error);
          
          // Verificar si es un error de ingredientes insuficientes
          if (this.ordersService.isInsufficientIngredientsError(error)) {
            const title = error.error?.alert || 'Ingredientes Insuficientes';
            const messages = this.ordersService.getInsufficientIngredientsMessages(error);
            
            // Mostrar modal de ingredientes insuficientes
            this.openIngredientsErrorModal(title, messages);
          }
          // Los errores genéricos ya se manejan en el servicio con toastr
        }
      });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.orderForm.controls).forEach(key => {
      const control = this.orderForm.get(key);
      control?.markAsTouched();
    });

    this.getProductControls().forEach(group => {
      Object.keys(group.controls).forEach(key => {
        group.get(key)?.markAsTouched();
      });
    });
  }

  // ========================================
  // MÉTODOS DE UTILIDAD
  // ========================================

  getProductName(productID: number): string {
    const product = this.availableProducts.find(p => p.productID === productID);
    return product ? product.productName : 'Producto no encontrado';
  }

  getProductPrice(productID: number): number {
    const product = this.availableProducts.find(p => p.productID === productID);
    return product ? product.productPrice : 0;
  }

  getProductSubtotal(index: number): string {
    const productControl = this.products.at(index);
    const productID = productControl.get('productID')?.value;
    const quantity = productControl.get('quantity')?.value;

    if (productID && quantity) {
      const price = this.getProductPrice(productID);
      const subtotal = price * quantity;
      return this.formatPrice(subtotal);
    }
    return this.formatPrice(0);
  }

  getTotalItems(): number {
    return this.getProductControls().reduce((total, control) => {
      const quantity = control.get('quantity')?.value || 0;
      return total + quantity;
    }, 0);
  }

  getOrderTotal(order?: OrderDetailDTO): number {
    if (order) {
      return order.products.reduce((sum, product) => sum + product.subtotal, 0);
    }

    const total = this.getProductControls().reduce((sum, control) => {
      const productID = control.get('productID')?.value;
      const quantity = control.get('quantity')?.value;
      
      if (productID && quantity) {
        const price = this.getProductPrice(productID);
        return sum + (price * quantity);
      }
      return sum;
    }, 0);

    return total;
  }

  formatPrice(price: number): string {
    return this.ordersService.formatPrice(price);
  }

  formatDate(date: string): string {
    return this.ordersService.formatDate(date);
  }

  getModalTitle(): string {
    switch (this.modalData.mode) {
      case 'create': return 'Crear Nueva Orden';
      case 'view': return 'Ver Detalles de la Orden';
      default: return 'Orden';
    }
  }

  getModalIcon(): string {
    switch (this.modalData.mode) {
      case 'create': return 'add_shopping_cart';
      case 'view': return 'visibility';
      default: return 'receipt_long';
    }
  }

  isViewMode(): boolean {
    return this.modalData.mode === 'view';
  }

  // ========================================
  // GETTERS PARA VALIDACIONES
  // ========================================

  get comment() { return this.orderForm.get('comment'); }

  getProductError(index: number, field: string): string {
    const control = this.products.at(index).get(field);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return field === 'productID' ? 'Selecciona un producto' : 'La cantidad es obligatoria';
      }
      if (control.errors['min']) return 'La cantidad debe ser mayor a 0';
      if (control.errors['max']) return 'La cantidad no puede ser mayor a 99';
    }
    return '';
  }

  // ========================================
  // MÉTODOS DE TRACKING PARA CARDS
  // ========================================

  trackByOrderId(index: number, order: OrderDetailDTO): number {
    return order.orderID;
  }

  trackByProductId(index: number, product: any): number {
    return product.productID || index;
  }
}