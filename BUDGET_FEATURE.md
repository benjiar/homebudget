# Budget Feature Implementation

## Overview

The Budget feature allows users to set, track, and manage spending budgets with support for monthly, yearly, and custom periods. The system provides intelligent budget suggestions based on historical spending patterns and real-time tracking of budget utilization.

## Features Implemented

### 1. Core Budget Management
- ✅ Create budgets with flexible periods (monthly, yearly, custom)
- ✅ Category-specific budgets or general household budgets
- ✅ Date range selection with auto-calculation for monthly/yearly periods
- ✅ Recurring budget support
- ✅ Edit and delete budgets
- ✅ Real-time spending tracking against budgets

### 2. Smart Budget Suggestions
- ✅ AI-powered budget recommendations based on last 3 months of spending
- ✅ Automatic calculation with 10% buffer for flexibility
- ✅ One-click application of suggestions
- ✅ Historical spending analysis by category

### 3. Budget Tracking & Visualization
- ✅ Progress bars showing budget utilization
- ✅ Color-coded status indicators (On Track, Off Track, Over Budget)
- ✅ Daily average spending calculation
- ✅ Projected spending based on current rate
- ✅ Days remaining in budget period
- ✅ Comprehensive summary cards

### 4. Advanced Features
- ✅ Granular date picker integration (reuses dashboard component)
- ✅ Category filtering
- ✅ Multiple active budgets support
- ✅ Overlap detection to prevent duplicate budgets
- ✅ Computed fields for analytics

## Technical Implementation

### Backend (NestJS)

#### Entity: `Budget`
Location: `apps/backend/src/entities/budget.entity.ts`

```typescript
- id: uuid
- name: string
- description?: string
- amount: decimal(10,2)
- period: enum (monthly, yearly, custom)
- start_date: date
- end_date: date
- category_id?: uuid (nullable)
- household_id: uuid
- is_active: boolean
- is_recurring: boolean
- metadata?: jsonb
- created_at: timestamp
- updated_at: timestamp
```

#### Migration
Location: `apps/backend/src/migrations/1733800000000-CreateBudgetsTable.ts`
- Creates budgets table with foreign keys to households and categories
- Indexes for efficient querying by household, period, category, and dates

#### Service: `BudgetsService`
Location: `apps/backend/src/budgets/budgets.service.ts`

Key methods:
- `create()` - Create new budget with validation
- `findAll()` - Get all budgets with filtering
- `findOne()` - Get single budget with details
- `update()` - Update existing budget
- `remove()` - Delete budget
- `getBudgetOverview()` - Calculate spending vs budget for all budgets
- `suggestBudgets()` - Generate AI-powered budget suggestions
- `calculateSpending()` - Calculate total spending in date range
- `findOverlappingBudgets()` - Prevent duplicate budgets

#### Controller: `BudgetsController`
Location: `apps/backend/src/budgets/budgets.controller.ts`

Endpoints:
- `POST /budgets` - Create budget
- `GET /budgets` - List all budgets (with filters)
- `GET /budgets/overview` - Get budget overview with analytics
- `GET /budgets/suggestions` - Get smart budget suggestions
- `GET /budgets/:id` - Get single budget
- `PUT /budgets/:id` - Update budget
- `DELETE /budgets/:id` - Delete budget

### Frontend (Next.js)

#### Component: `BudgetForm`
Location: `apps/web/src/components/BudgetForm.tsx`

Features:
- Form validation
- Auto-calculation of end dates for monthly/yearly periods
- Category selector with icon support
- Date range picker
- Recurring budget checkbox
- Real-time error display

#### Page: `Budgets`
Location: `apps/web/src/pages/budgets.tsx`

Features:
- Budget overview with summary cards
- Budget list with progress bars
- Create/Edit modal with BudgetForm
- Smart suggestions modal
- Delete confirmation
- Status badges (On Track, Off Track, Over Budget)
- Real-time analytics display

### Shared Types
Location: `packages/types/src/entities.ts`

New types:
- `Budget` - Main budget entity type
- `BudgetPeriod` - Enum for period types
- `BudgetOverviewItem` - Budget with computed analytics
- `BudgetSummary` - Aggregate budget statistics

## Database Schema

```sql
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  period VARCHAR(20) NOT NULL CHECK (period IN ('monthly', 'yearly', 'custom')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  is_recurring BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_budgets_household_period_start ON budgets(household_id, period, start_date);
CREATE INDEX idx_budgets_household_category_period ON budgets(household_id, category_id, period);
CREATE INDEX idx_budgets_dates ON budgets(start_date, end_date);
CREATE INDEX idx_budgets_active ON budgets(is_active);
```

## Usage Examples

### Creating a Monthly Budget
```typescript
const budgetData = {
  name: "Groceries Budget",
  description: "Monthly food shopping budget",
  amount: 2000,
  period: BudgetPeriod.MONTHLY,
  start_date: "2024-01-01",
  end_date: "2024-01-31",
  category_id: "uuid-of-groceries-category",
  is_recurring: true
};

await client.post('/budgets', budgetData);
```

### Getting Budget Overview
```typescript
const overview = await client.get<BudgetSummary>('/budgets/overview');
// Returns: total budgets, spending, progress, and detailed items
```

### Smart Suggestions
```typescript
const suggestions = await client.get('/budgets/suggestions');
// Returns: AI-powered budget suggestions based on historical spending
```

## Future Enhancements

### Notifications (Planned)
- Email/push notifications when approaching budget limit (80%, 90%, 100%)
- Weekly budget summary emails
- Budget rollover notifications

### Advanced Analytics
- Budget vs actual comparison charts
- Trend analysis over multiple periods
- Category comparison views
- Budget efficiency scores

### Smart Features
- Automatic budget adjustment based on income changes
- Seasonal budget variations
- Budget templates for quick setup
- Family member budget allocations

## Testing

### Backend Tests (To Implement)
```bash
# Unit tests for service
npm run test apps/backend/src/budgets/budgets.service.spec.ts

# Integration tests for controller
npm run test apps/backend/src/budgets/budgets.controller.spec.ts
```

### Frontend Tests (To Implement)
```bash
# Component tests
npm run test apps/web/src/components/BudgetForm.test.tsx

# Page tests
npm run test apps/web/src/pages/budgets.test.tsx
```

## Running the Application

1. Run migrations:
```bash
cd apps/backend
npm run migration:run
```

2. Start backend:
```bash
cd apps/backend
npm run start:dev
```

3. Start frontend:
```bash
cd apps/web
npm run dev
```

4. Navigate to `/budgets` in the application

## API Documentation

### Budget Object
```json
{
  "id": "uuid",
  "name": "Monthly Groceries",
  "description": "Budget for food shopping",
  "amount": 2000.00,
  "period": "monthly",
  "start_date": "2024-01-01",
  "end_date": "2024-01-31",
  "category_id": "uuid",
  "household_id": "uuid",
  "is_active": true,
  "is_recurring": true,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### Budget Overview Response
```json
{
  "total_budgets": 5,
  "total_budget_amount": 10000.00,
  "total_spent": 6500.00,
  "total_remaining": 3500.00,
  "overall_percentage": 65.0,
  "over_budget_count": 1,
  "budgets": [
    {
      "budget": { /* Budget object */ },
      "current_spending": 1500.00,
      "remaining": 500.00,
      "percentage_used": 75.0,
      "is_over_budget": false,
      "days_remaining": 10,
      "days_elapsed": 20,
      "average_daily_spending": 50.00,
      "projected_spending": 1800.00,
      "on_track": true
    }
  ]
}
```

## Navigation

The budget feature is accessible via:
- Main navigation: `/budgets`
- Icon: 💰 (Money bag)
- Requires household membership

## Permissions

All budget operations require:
- Authenticated user
- Active household membership
- Appropriate household role permissions (SET_BUDGETS permission)

## Notes

- The old `/budget` page has been deprecated in favor of `/budgets`
- Budget amounts are stored as DECIMAL(10,2) for precise financial calculations
- Smart suggestions require at least 3 months of receipt data
- Budgets support both category-specific and general household budgets
- Date ranges are validated to prevent overlapping budgets for the same category
