// ============================================
// INTERFACES PRINCIPALES PARA DIEGO'S WAFLES
// ============================================

// Genérica para respuestas del backend
export interface ApiResponse<T = any> {
  alert: string;
  status: boolean;
  messages: string[];
  data: T | null;
}

// Genérica para respuestas paginadas
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// Tipos para formularios
export interface FormValidationErrors {
  [key: string]: string;
}

// Estados de carga
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

// Opción para selects
export interface SelectOption<T = string | number> {
  value: T;
  label: string;
  disabled?: boolean;
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

export interface UserRegister extends Omit<User, 'userID' | 'userStatus' | 'rolName'> {
  userPassword: string;
  userConfirmPassword: string;
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

export interface BaseRecipeIngredient {
  ingredientID: number;
  ingredientName: string;
  ingredientUnit: string;
  requiredQuantity: number;
}

export type RecipeIngredientDetail = BaseRecipeIngredient;
export type RecipeIngredientDetailDTO = BaseRecipeIngredient;

export interface Recipe {
  recipeID: number;
  recipeName: string;
  ingredients: RecipeIngredientDetail[];
}

export interface RecipeCreate {
  recipeName: string;
  ingredients: {
    ingredientID: number;
    requiredQuantity: number;
  }[];
}

export interface RecipeDetailDTO {
  recipeID: number;
  recipeName: string;
  ingredients: RecipeIngredientDetailDTO[];
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
  products: Pick<OrderProductDetail, 'productID' | 'quantity'>[];
}
