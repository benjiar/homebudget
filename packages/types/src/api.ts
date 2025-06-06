import { 
  User, 
  Household, 
  HouseholdMember, 
  Category, 
  Receipt, 
  ReceiptSummary,
  BudgetOverview,
  ExpensesByDate,
  CategorySpending
} from './entities';
import { HouseholdRole, Currency } from './enums';

// ============================================================================
// COMMON API TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
  details?: any;
}

// ============================================================================
// USER API TYPES
// ============================================================================

export interface CreateUserRequest {
  email: string;
  full_name?: string;
  avatar_url?: string;
  preferences?: Record<string, any>;
}

export interface UpdateUserRequest {
  full_name?: string;
  avatar_url?: string;
  preferences?: Record<string, any>;
}

export interface UserResponse extends User {}

export interface UsersListResponse extends PaginatedResponse<User> {}

// ============================================================================
// HOUSEHOLD API TYPES
// ============================================================================

export interface CreateHouseholdRequest {
  name: string;
  description?: string;
  currency?: Currency;
  settings?: Record<string, any>;
}

export interface UpdateHouseholdRequest {
  name?: string;
  description?: string;
  currency?: Currency;
  settings?: Record<string, any>;
}

export interface AddMemberRequest {
  userId: string;
  role?: HouseholdRole;
}

export interface UpdateMemberRoleRequest {
  role: HouseholdRole;
}

export interface InviteMemberRequest {
  email: string;
  role?: HouseholdRole;
}

export interface HouseholdResponse extends Household {}

export interface HouseholdsListResponse extends PaginatedResponse<Household> {}

export interface HouseholdMemberResponse extends HouseholdMember {}

// ============================================================================
// CATEGORY API TYPES
// ============================================================================

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  monthly_budget?: number;
  household_id: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  monthly_budget?: number;
  is_active?: boolean;
}

export interface SetBudgetRequest {
  monthly_budget: number;
}

export interface CategoryResponse extends Category {}

export interface CategoriesListResponse extends PaginatedResponse<Category> {}

export interface BudgetOverviewResponse extends BudgetOverview {}

// ============================================================================
// RECEIPT API TYPES
// ============================================================================

export interface CreateReceiptRequest {
  title: string;
  amount: number;
  receipt_date: string; // ISO date string
  notes?: string;
  photo_url?: string;
  metadata?: Record<string, any>;
  household_id: string;
  category_id: string;
}

export interface UpdateReceiptRequest {
  title?: string;
  amount?: number;
  receipt_date?: string; // ISO date string
  notes?: string;
  photo_url?: string;
  metadata?: Record<string, any>;
  category_id?: string;
}

export interface ReceiptFilters {
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  categoryIds?: string[];
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ReceiptResponse extends Receipt {}

export interface ReceiptsListResponse {
  receipts: Receipt[];
  total: number;
  summary: ReceiptSummary;
}

export interface MonthlyReportRequest {
  month: number; // 1-12
  year: number;
}

export interface MonthlyReportResponse extends ReceiptSummary {}

export interface ExpensesByDateRequest {
  startDate: string; // ISO date string
  endDate: string; // ISO date string
}

export interface ExpensesByDateResponse {
  expenses: ExpensesByDate[];
}

// ============================================================================
// AUTHENTICATION API TYPES
// ============================================================================

export interface SignUpRequest {
  email: string;
  password: string;
  full_name?: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface UpdatePasswordRequest {
  current_password: string;
  new_password: string;
}

// ============================================================================
// FILE UPLOAD API TYPES
// ============================================================================

export interface FileUploadResponse {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}

export interface UploadReceiptPhotoResponse extends FileUploadResponse {}

export interface UploadAvatarResponse extends FileUploadResponse {}

// ============================================================================
// DASHBOARD API TYPES
// ============================================================================

export interface DashboardRequest {
  household_id: string;
  period?: 'week' | 'month' | 'quarter' | 'year';
}

export interface DashboardStats {
  total_receipts: number;
  total_spending: number;
  average_daily_spending: number;
  budget_utilization: number;
  top_categories: CategorySpending[];
  recent_receipts: Receipt[];
  spending_trend: ExpensesByDate[];
}

export interface DashboardResponse {
  household: Household;
  stats: DashboardStats;
  budget_overview: BudgetOverview;
}

// ============================================================================
// REPORTING API TYPES
// ============================================================================

export interface ReportFilters {
  household_id: string;
  startDate: string;
  endDate: string;
  categoryIds?: string[];
  format?: 'json' | 'csv' | 'pdf';
}

export interface ExportRequest extends ReportFilters {
  format: 'csv' | 'pdf';
}

export interface ExportResponse {
  download_url: string;
  filename: string;
  expires_at: string;
}

// ============================================================================
// SEARCH API TYPES
// ============================================================================

export interface SearchRequest {
  query: string;
  household_id: string;
  filters?: {
    type?: ('receipts' | 'categories')[];
    startDate?: string;
    endDate?: string;
  };
}

export interface SearchResult {
  type: 'receipt' | 'category';
  id: string;
  title: string;
  description?: string;
  highlight?: string;
  data: Receipt | Category;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
} 