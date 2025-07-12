// ============================================
// INTERFACES PRINCIPALES PARA DIEGO'S WAFLES
// ============================================

// Respuesta genérica del API
export interface ApiResponse<T = any> {
  alert: string;
  status: boolean;
  messages: string[];
  data: T;
}

// ============================================
// AUTH & USERS
// ============================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  userID: number;
  token: string;
  email: string;
  rol: number;
}

export interface User {
  userID: number;
  userName: string;
  userEmail: string;
  userPhone: string;
  userStatus: boolean;
  rolID: number;
  rolName: string;
}

export interface UserListDTO {
  userName: string;
  userEmail: string;
  userPhone: string;
  roleName: string;
}

export interface UserRegister {
  userName: string;
  userEmail: string;
  userPhone: string;
  userPassword: string;
  userConfirmPassword: string;
  rolID: number;
}

export interface PasswordUpdate {
  oldPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface Role {
  rolID: number;
  rolName: string;
}

// ============================================
// PROVIDERS
// ============================================

export interface Provider {
  providerID: number;
  providerName: string;
  providerPhone: string;
}

// ============================================
// INGREDIENTS
// ============================================

export type IngredientUnit = 'kg' | 'gr' | 'l' | 'ml' | 'u';

export interface Ingredient {
  ingredientID: number;
  ingredientName: string;
  ingredientUnit: IngredientUnit;
  ingredientQuantity: number;
  minimumQuantity: number;
  providerID: number;
}

export interface IngredientWithProvider extends Ingredient {
  providerName: string;
}

// ============================================
// RECIPES
// ============================================

export interface Recipe {
  recipeID: number;
  recipeName: string;
  ingredients: RecipeIngredientDetail[];
}

export interface RecipeIngredientDetail {
  ingredientID: number;
  ingredientName: string;
  ingredientUnit: string;
  requiredQuantity: number;
}

export interface RecipeCreate {
  recipeName: string;
  ingredients: {
    ingredientID: number;
    requiredQuantity: number;
  }[];
}

// ============================================
// PRODUCTS
// ============================================

export interface Product {
  productID: number;
  productName: string;
  productPrice: number;
  recipes: ProductRecipeDetail[];
}

export interface ProductRecipeDetail {
  recipeID: number;
  recipeName: string;
}

export interface ProductCreate {
  productName: string;
  productPrice: number;
  recipeIDs: number[];
}

// ============================================
// ORDERS
// ============================================

export interface Order {
  orderID: number;
  createdAt: string;
  comment: string;
  products: OrderProductDetail[];
  total?: number;
}

export interface OrderProductDetail {
  productID: number;
  productName: string;
  productPrice: number;
  quantity: number;
  subtotal: number;
}

export interface OrderCreate {
  comment: string;
  products: {
    productID: number;
    quantity: number;
  }[];
}

// ============================================
// UTILITY TYPES
// ============================================

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface SelectOption {
  value: any;
  label: string;
  disabled?: boolean;
}

// Tipos para formularios
export interface FormValidationErrors {
  [key: string]: string;
}

// Estados de loading
export interface LoadingState {
  loading: boolean;
  error: string | null;
}

// Filtros genéricos
export interface BaseFilter {
  page?: number;
  size?: number;
  sort?: string;
  search?: string;
}