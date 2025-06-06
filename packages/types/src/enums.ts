// Household member roles with hierarchy
export enum HouseholdRole {
  OWNER = 'owner',
  ADMIN = 'admin', 
  MEMBER = 'member',
  VIEWER = 'viewer'
}

// Permission levels for different operations
export enum Permission {
  // User management
  MANAGE_USERS = 'manage_users',
  VIEW_USERS = 'view_users',
  
  // Household management
  MANAGE_HOUSEHOLD = 'manage_household',
  UPDATE_HOUSEHOLD = 'update_household',
  DELETE_HOUSEHOLD = 'delete_household',
  VIEW_HOUSEHOLD = 'view_household',
  
  // Member management
  INVITE_MEMBERS = 'invite_members',
  REMOVE_MEMBERS = 'remove_members',
  UPDATE_MEMBER_ROLES = 'update_member_roles',
  
  // Category management
  CREATE_CATEGORIES = 'create_categories',
  UPDATE_CATEGORIES = 'update_categories',
  DELETE_CATEGORIES = 'delete_categories',
  SET_BUDGETS = 'set_budgets',
  VIEW_CATEGORIES = 'view_categories',
  
  // Receipt management
  CREATE_RECEIPTS = 'create_receipts',
  UPDATE_RECEIPTS = 'update_receipts',
  DELETE_RECEIPTS = 'delete_receipts',
  VIEW_RECEIPTS = 'view_receipts',
  
  // Reporting
  VIEW_REPORTS = 'view_reports',
  EXPORT_DATA = 'export_data'
}

// Role permissions mapping
export const ROLE_PERMISSIONS: Record<HouseholdRole, Permission[]> = {
  [HouseholdRole.OWNER]: [
    // Owners have all permissions
    Permission.MANAGE_USERS,
    Permission.VIEW_USERS,
    Permission.MANAGE_HOUSEHOLD,
    Permission.UPDATE_HOUSEHOLD,
    Permission.DELETE_HOUSEHOLD,
    Permission.VIEW_HOUSEHOLD,
    Permission.INVITE_MEMBERS,
    Permission.REMOVE_MEMBERS,
    Permission.UPDATE_MEMBER_ROLES,
    Permission.CREATE_CATEGORIES,
    Permission.UPDATE_CATEGORIES,
    Permission.DELETE_CATEGORIES,
    Permission.SET_BUDGETS,
    Permission.VIEW_CATEGORIES,
    Permission.CREATE_RECEIPTS,
    Permission.UPDATE_RECEIPTS,
    Permission.DELETE_RECEIPTS,
    Permission.VIEW_RECEIPTS,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_DATA,
  ],
  [HouseholdRole.ADMIN]: [
    Permission.VIEW_USERS,
    Permission.UPDATE_HOUSEHOLD,
    Permission.VIEW_HOUSEHOLD,
    Permission.INVITE_MEMBERS,
    Permission.REMOVE_MEMBERS,
    Permission.CREATE_CATEGORIES,
    Permission.UPDATE_CATEGORIES,
    Permission.DELETE_CATEGORIES,
    Permission.SET_BUDGETS,
    Permission.VIEW_CATEGORIES,
    Permission.CREATE_RECEIPTS,
    Permission.UPDATE_RECEIPTS,
    Permission.DELETE_RECEIPTS,
    Permission.VIEW_RECEIPTS,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_DATA,
  ],
  [HouseholdRole.MEMBER]: [
    Permission.VIEW_USERS,
    Permission.VIEW_HOUSEHOLD,
    Permission.CREATE_CATEGORIES,
    Permission.UPDATE_CATEGORIES,
    Permission.SET_BUDGETS,
    Permission.VIEW_CATEGORIES,
    Permission.CREATE_RECEIPTS,
    Permission.UPDATE_RECEIPTS,
    Permission.DELETE_RECEIPTS,
    Permission.VIEW_RECEIPTS,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_DATA,
  ],
  [HouseholdRole.VIEWER]: [
    Permission.VIEW_USERS,
    Permission.VIEW_HOUSEHOLD,
    Permission.VIEW_CATEGORIES,
    Permission.VIEW_RECEIPTS,
    Permission.VIEW_REPORTS,
  ],
};

// Helper function to check if a role has a specific permission
export function hasPermission(role: HouseholdRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

// Currency types
export enum Currency {
  ILS = 'ILS', // New Israeli Shekel (ISO code: ILS)
  USD = 'USD', // US Dollar
  EUR = 'EUR', // Euro
  GBP = 'GBP', // British Pound
  CAD = 'CAD', // Canadian Dollar
  AUD = 'AUD', // Australian Dollar
  JPY = 'JPY', // Japanese Yen
}

// Default category icons and colors
export const DEFAULT_CATEGORY_ICONS = [
  'utensils', 'zap', 'home', 'car', 'heart', 'baby',
  'play', 'shopping-bag', 'more-horizontal', 'book',
  'briefcase', 'gift', 'plane', 'coffee'
] as const;

export const DEFAULT_CATEGORY_COLORS = [
  '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336',
  '#FFEB3B', '#E91E63', '#607D8B', '#9E9E9E', '#795548',
  '#FF5722', '#3F51B5', '#009688', '#FFC107'
] as const; 