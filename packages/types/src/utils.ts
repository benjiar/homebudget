import { HouseholdRole, Permission, ROLE_PERMISSIONS, Currency } from './enums';
import { User, Household, HouseholdMember } from './entities';

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isUser(obj: any): obj is User {
  return obj && typeof obj.id === 'string' && typeof obj.email === 'string';
}

export function isHousehold(obj: any): obj is Household {
  return obj && typeof obj.id === 'string' && typeof obj.name === 'string';
}

export function isHouseholdMember(obj: any): obj is HouseholdMember {
  return obj && typeof obj.id === 'string' && typeof obj.user_id === 'string' && typeof obj.household_id === 'string';
}

// ============================================================================
// PERMISSION HELPERS
// ============================================================================

export function userHasPermission(
  user: User, 
  household: Household, 
  permission: Permission
): boolean {
  if (!user.household_memberships) return false;
  
  const membership = user.household_memberships.find(
    m => m.household_id === household.id && m.is_active
  );
  
  if (!membership) return false;
  
  return ROLE_PERMISSIONS[membership.role].includes(permission);
}

export function canUserAccessHousehold(user: User, householdId: string): boolean {
  if (!user.household_memberships) return false;
  
  return user.household_memberships.some(
    m => m.household_id === householdId && m.is_active
  );
}

export function getUserRoleInHousehold(user: User, householdId: string): HouseholdRole | null {
  if (!user.household_memberships) return null;
  
  const membership = user.household_memberships.find(
    m => m.household_id === householdId && m.is_active
  );
  
  return membership?.role || null;
}

export function isHouseholdOwner(user: User, householdId: string): boolean {
  const role = getUserRoleInHousehold(user, householdId);
  return role === HouseholdRole.OWNER;
}

export function isHouseholdAdmin(user: User, householdId: string): boolean {
  const role = getUserRoleInHousehold(user, householdId);
  return role === HouseholdRole.OWNER || role === HouseholdRole.ADMIN;
}

// ============================================================================
// DATE HELPERS
// ============================================================================

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0]; // YYYY-MM-DD format
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
}

export function formatDisplayDate(date: string | Date, locale = 'en-US'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatCurrency(amount: number, currency = 'ILS', locale?: string): string {
  // Set appropriate locale based on currency if not provided
  if (!locale) {
    switch (currency) {
      case 'ILS':
        locale = 'he-IL'; // Hebrew (Israel) for Israeli Shekel
        break;
      case 'USD':
        locale = 'en-US';
        break;
      case 'EUR':
        locale = 'de-DE';
        break;
      case 'GBP':
        locale = 'en-GB';
        break;
      default:
        locale = 'en-US';
    }
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function getMonthYear(date: string | Date): { month: number; year: number } {
  const d = typeof date === 'string' ? new Date(date) : date;
  return {
    month: d.getMonth() + 1, // 1-12
    year: d.getFullYear()
  };
}

export function getStartOfMonth(year: number, month: number): Date {
  return new Date(year, month - 1, 1);
}

export function getEndOfMonth(year: number, month: number): Date {
  return new Date(year, month, 0);
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function validateEmail(email: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!email) {
    errors.push({ field: 'email', message: 'Email is required', code: 'REQUIRED' });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push({ field: 'email', message: 'Invalid email format', code: 'INVALID_FORMAT' });
  }
  
  return { isValid: errors.length === 0, errors };
}

export function validateAmount(amount: number): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (amount === undefined || amount === null) {
    errors.push({ field: 'amount', message: 'Amount is required', code: 'REQUIRED' });
  } else if (amount <= 0) {
    errors.push({ field: 'amount', message: 'Amount must be greater than 0', code: 'INVALID_VALUE' });
  } else if (amount > 999999.99) {
    errors.push({ field: 'amount', message: 'Amount is too large', code: 'EXCEEDS_LIMIT' });
  }
  
  return { isValid: errors.length === 0, errors };
}

export function validateTitle(title: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!title || title.trim().length === 0) {
    errors.push({ field: 'title', message: 'Title is required', code: 'REQUIRED' });
  } else if (title.length > 255) {
    errors.push({ field: 'title', message: 'Title is too long (max 255 characters)', code: 'EXCEEDS_LIMIT' });
  }
  
  return { isValid: errors.length === 0, errors };
}

export function validateHouseholdName(name: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!name || name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Household name is required', code: 'REQUIRED' });
  } else if (name.length < 2) {
    errors.push({ field: 'name', message: 'Household name must be at least 2 characters', code: 'TOO_SHORT' });
  } else if (name.length > 255) {
    errors.push({ field: 'name', message: 'Household name is too long (max 255 characters)', code: 'EXCEEDS_LIMIT' });
  }
  
  return { isValid: errors.length === 0, errors };
}

export function validateCurrency(currency: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Get valid currency values from the enum
  const validCurrencies = Object.values(Currency);
  
  if (!currency) {
    errors.push({ field: 'currency', message: 'Currency is required', code: 'REQUIRED' });
  } else if (!validCurrencies.includes(currency as Currency)) {
    errors.push({ 
      field: 'currency', 
      message: `Invalid currency. Must be one of: ${validCurrencies.join(', ')}`, 
      code: 'INVALID_VALUE' 
    });
  }
  
  return { isValid: errors.length === 0, errors };
}

// ============================================================================
// SORTING AND FILTERING HELPERS
// ============================================================================

export function sortByDate<T extends { created_at: string }>(items: T[], order: 'asc' | 'desc' = 'desc'): T[] {
  return [...items].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return order === 'asc' ? dateA - dateB : dateB - dateA;
  });
}

export function sortByAmount<T extends { amount: number }>(items: T[], order: 'asc' | 'desc' = 'desc'): T[] {
  return [...items].sort((a, b) => {
    return order === 'asc' ? a.amount - b.amount : b.amount - a.amount;
  });
}

export function sortByName<T extends { name: string }>(items: T[], order: 'asc' | 'desc' = 'asc'): T[] {
  return [...items].sort((a, b) => {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();
    if (order === 'asc') {
      return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
    } else {
      return nameA > nameB ? -1 : nameA < nameB ? 1 : 0;
    }
  });
}

// ============================================================================
// API URL HELPERS
// ============================================================================

export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, String(v)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });
  
  return searchParams.toString();
}

export function buildApiUrl(baseUrl: string, endpoint: string, params?: Record<string, any>): string {
  const url = `${baseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
  if (params) {
    const queryString = buildQueryString(params);
    return queryString ? `${url}?${queryString}` : url;
  }
  return url;
} 