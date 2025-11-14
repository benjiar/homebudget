import { HouseholdRole, Currency } from './enums';

// Base fields that all entities have
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// User entity type
export interface User extends BaseEntity {
  email: string;
  full_name?: string;
  avatar_url?: string;
  preferences?: Record<string, any>;
  
  // Populated relationships (optional for API responses)
  household_memberships?: HouseholdMember[];
  receipts?: Receipt[];
}

// Household entity type
export interface Household extends BaseEntity {
  name: string;
  description?: string;
  currency: Currency;
  settings?: Record<string, any>;
  
  // Populated relationships (optional for API responses)
  members?: HouseholdMember[];
  categories?: Category[];
  receipts?: Receipt[];
}

// Household member relationship type
export interface HouseholdMember extends BaseEntity {
  user_id: string;
  household_id: string;
  role: HouseholdRole;
  is_active: boolean;
  invited_at?: string;
  joined_at?: string;
  
  // Populated relationships (optional for API responses)
  user?: User;
  household?: Household;
}

// Category entity type
export interface Category extends BaseEntity {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  monthly_budget?: number;
  is_active: boolean;
  is_system: boolean;
  household_id: string;
  
  // Populated relationships (optional for API responses)
  household?: Household;
  receipts?: Receipt[];
  
  // Computed fields (for budget overview)
  current_spending?: number;
  budget_remaining?: number;
  budget_percentage?: number;
}

// Receipt entity type
export interface Receipt extends BaseEntity {
  title: string;
  amount: number;
  receipt_date: string; // ISO date string
  notes?: string;
  photo_url?: string;
  metadata?: Record<string, any>;
  household_id: string;
  category_id: string;
  created_by_id: string;
  
  // Populated relationships (optional for API responses)
  household?: Household;
  category?: Category;
  created_by?: User;
}

// Budget period enum
export enum BudgetPeriod {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  CUSTOM = 'custom'
}

// Budget entity type
export interface Budget extends BaseEntity {
  name: string;
  description?: string;
  amount: number;
  period: BudgetPeriod;
  start_date: string; // ISO date string
  end_date: string; // ISO date string
  category_id?: string;
  household_id: string;
  is_active: boolean;
  is_recurring: boolean;
  metadata?: Record<string, any>;
  
  // Populated relationships (optional for API responses)
  household?: Household;
  category?: Category;
  
  // Computed fields (for budget tracking)
  current_spending?: number;
  remaining?: number;
  percentage_used?: number;
  days_remaining?: number;
  average_daily_spending?: number;
  projected_spending?: number;
}

// Budget overview and analytics types
export interface BudgetOverviewItem {
  budget: Budget;
  current_spending: number;
  remaining: number;
  percentage_used: number;
  is_over_budget: boolean;
  days_remaining: number;
  days_elapsed: number;
  average_daily_spending: number;
  projected_spending: number;
  on_track: boolean;
}

export interface BudgetSummary {
  total_budgets: number;
  total_budget_amount: number;
  total_spent: number;
  total_remaining: number;
  overall_percentage: number;
  over_budget_count: number;
  budgets: BudgetOverviewItem[];
}

// Summary and analytics types
export interface ReceiptSummary {
  total_receipts: number;
  total_amount: number;
  average_amount: number;
  by_category: CategorySpending[];
}

export interface CategorySpending {
  category: Category;
  count: number;
  total: number;
}

export interface BudgetOverview {
  categories: CategoryBudgetStatus[];
  summary: BudgetSummary;
}

export interface CategoryBudgetStatus {
  category: Category;
  budget: number;
  spent: number;
  remaining: number;
  percentage: number;
}

export interface BudgetSummary {
  total_budget: number;
  total_spent: number;
  total_remaining: number;
  overall_percentage: number;
}

export interface ExpensesByDate {
  date: string;
  total: number;
  count: number;
}

// Invitation and member management types
export interface PendingInvitation {
  id: string;
  email: string;
  household_id: string;
  role: HouseholdRole;
  invited_by: string;
  invited_at: string;
  expires_at: string;
  
  // Populated relationships
  household?: Household;
  invited_by_user?: User;
} 