# Supabase Setup Guide

## Step 1: Create Supabase Project

1. **Go to [Supabase](https://supabase.com)** and sign in/create account
2. **Click "New Project"**
3. **Fill in project details:**
   - **Organization**: Select or create your organization
   - **Name**: `homebudget` (or your preferred name)
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your location
   - **Pricing Plan**: Start with Free tier

4. **Wait for project creation** (takes 1-2 minutes)

## Step 2: Get Project Configuration

Once your project is ready:

1. **Go to Project Settings** (gear icon in sidebar)
2. **Go to "API" section**
3. **Copy the following values:**
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`)
   - **service_role key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`, longer than anon key)

4. **Go to "Database" section**
   - **Copy Database URL** (postgresql connection string)

## Step 3: Configure Environment Variables

Create/update the following files with your Supabase configuration:

### `apps/backend/.env`
```env
# Supabase Configuration
SUPABASE_URL=your_project_url_here
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_role_key_here

# Database Configuration  
DATABASE_URL=your_database_url_here
POSTGRES_HOST=db.your_project_ref.supabase.co
POSTGRES_PORT=5432
POSTGRES_DATABASE=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_database_password_here

# Backend Configuration
BACKEND_PORT=3001
NODE_ENV=development
```

### `apps/web/.env.local` (update existing)
```env
# Supabase Configuration (Frontend)
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Google OAuth (if using)
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

## Step 4: Enable Authentication Providers

In your Supabase dashboard:

1. **Go to Authentication > Providers**
2. **Enable "Email" provider** (should be enabled by default)
3. **For Google OAuth:**
   - Enable "Google" provider
   - Add your Google OAuth credentials
   - Set authorized redirect URLs

## Step 5: Verify Setup

After completing the setup above, we'll test the connection and create the database schema.

---

**Next Steps:**
- Fill in your actual Supabase project details above
- Run the backend to test database connection
- Create database schema and tables 