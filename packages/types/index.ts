// ============================================================================
// SHARED TYPES FOR HOME BUDGET APP
// ============================================================================

// Export all enums and constants
export * from './src/enums';

// Export all entity types
export * from './src/entities';

// Export all API types
export * from './src/api';

// Export all utility types and functions
export * from './src/utils';

// Re-export commonly used types for convenience
export type {
  // Core entities
  User,
  Household,
  HouseholdMember,
  Category,
  Receipt,
  
  // Analytics types
  ReceiptSummary,
  BudgetOverview,
  CategorySpending,
} from './src/entities';

export type {
  // API request types
  CreateUserRequest,
  CreateHouseholdRequest,
  CreateCategoryRequest,
  CreateReceiptRequest,
  
  // API response types
  UserResponse,
  HouseholdResponse,
  CategoryResponse,
  ReceiptResponse,
  ReceiptsListResponse,
  
  // Common API types
  ApiResponse,
  PaginatedResponse,
  ApiError,
  
  // Auth types
  AuthResponse,
  SignInRequest,
  SignUpRequest,
} from './src/api';

export {
  // Enums
  HouseholdRole,
  Permission,
  Currency,
  
  // Permission helpers
  hasPermission,
  ROLE_PERMISSIONS,
} from './src/enums';

export {
  // Common utilities
  userHasPermission,
  canUserAccessHousehold,
  getUserRoleInHousehold,
  isHouseholdOwner,
  isHouseholdAdmin,
  
  // Validation helpers
  validateEmail,
  validateAmount,
  validateTitle,
  validateHouseholdName,
  
  // Type guards
  isUser,
  isHousehold,
  isHouseholdMember,
  
  // Date/format helpers
  formatDate,
  formatDateTime,
  formatDisplayDate,
  formatCurrency,
  getMonthYear,
  getStartOfMonth,
  getEndOfMonth,
  
  // Sorting helpers
  sortByDate,
  sortByAmount,
  sortByName,
  
  // API helpers
  buildQueryString,
  buildApiUrl,
} from './src/utils';
