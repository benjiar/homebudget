# Frontend Migration Guide

## ✅ Completed

### 1. Infrastructure
- ✅ Created `apiClient.ts` - Centralized API client with auto header injection
- ✅ Created `useApiClient.ts` - React hook for easy API client usage  
- ✅ Created `apiProxy.ts` - Server-side proxy helper for API routes
- ✅ Updated `HouseholdContext.tsx` - Multi-select with "all" support
- ✅ Created `MultiSelectHouseholdDropdown.tsx` - Modern UI component
- ✅ Updated `Layout.tsx` - Global household selector in header

### 2. API Routes (Server-Side)
- ✅ `/api/categories` - GET (with filter), POST
- ✅ `/api/categories/[id]` - GET, PATCH, DELETE
- ✅ `/api/categories/budget-overview` - GET (new, replaces [householdId] version)
- ✅ `/api/receipts` - GET (with filter + query params), POST
- ✅ `/api/receipts/[id]` - GET, PATCH, DELETE
- ✅ `/api/receipts/monthly-report` - GET (new)
- ✅ `/api/receipts/category/[categoryId]` - GET (new)
- ✅ `/api/receipts/expenses-by-date` - GET (new)
- ✅ `/api/invitations` - GET (with filter), POST

## 🔄 Pages to Migrate

Replace `fetch` calls with `useApiClient()` hook. Remove household ID from URLs.

### Pattern to Follow:

**OLD:**
```typescript
const response = await fetch(`/api/categories/household/${selectedHousehold}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

**NEW:**
```typescript
const client = useApiClient(); // Auto-configured with token and households
const data = await client.get('/categories');
```

### Pages List:

1. **receipts.tsx** (~690 lines) - Split recommended
   - Replace: `/api/receipts/household/${householdId}`
   - With: `/receipts`
   - Also update categories fetch
   
2. **categories.tsx** 
   - Replace: `/api/categories/household/${householdId}`
   - With: `/categories`
   
3. **budget.tsx**
   - Replace: `/api/categories/budget-overview/${householdId}`
   - With: `/categories/budget-overview`
   
4. **reports.tsx** (~400+ lines) - Split recommended
   - Replace: `/api/categories/household/${householdId}`
   - With: `/categories`
   - Replace: `/api/receipts/household/${householdId}`
   - With: `/receipts`
   
5. **index.tsx** (Dashboard)
   - Replace: `/api/receipts/household/${householdId}`
   - With: `/receipts`
   - Replace: `/api/categories/budget-overview/${householdId}`
   - With: `/categories/budget-overview`

## 📦 File Size Management

Files over 200 lines should be split:

### receipts.tsx (690 lines) → Split into:
- `pages/receipts.tsx` - Main component (~150 lines)
- `components/ReceiptsList.tsx` - List view
- `components/ReceiptFilters.tsx` - Filter UI
- `hooks/useReceipts.ts` - Data fetching logic

### reports.tsx (400+ lines) → Split into:
- `pages/reports.tsx` - Main component (~150 lines)
- `components/reports/` folder:
  - `CategoryReport.tsx`
  - `TimeSeriesReport.tsx`
  - `ExportModal.tsx`
- `hooks/useReports.ts` - Data fetching logic

## 🎯 Benefits After Migration

1. **No Manual Header Management** - Automatic via context
2. **Cleaner Code** - No URL construction with IDs
3. **Type Safety** - Full TypeScript support
4. **Consistent Patterns** - Same API style everywhere
5. **Easy Testing** - Mock API client, not fetch
6. **Flexible Filtering** - Select any combination of households

## 🔑 Key Points

- Empty household array = "All" (header omitted)
- Non-empty array = specific households (comma-separated in header)
- Backend handles validation and filtering
- Frontend just selects what to show
