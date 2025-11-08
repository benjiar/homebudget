# HomeBudget

A full-stack home budget tracking application built with a modern tech stack.

## Tech Stack

- **Monorepo**: Turborepo + PNPM
- **Backend**: NestJS + TypeORM + Supabase
- **Web**: Next.js + TailwindCSS
- **Mobile**: Expo + React Native
- **Shared**: TypeScript + ESLint + Prettier

## Project Structure

```
homebudget/
├── apps/
│   ├── web/          # Next.js web application
│   ├── mobile/       # Expo mobile application
│   └── backend/      # NestJS backend
├── packages/
│   ├── types/        # Shared TypeScript types
│   ├── ui/           # Shared UI components
│   └── config/       # Shared configurations
└── package.json
```

## Supabase Integration

This project uses Supabase for authentication and database management in both frontend and backend:

- **Frontend (Next.js Web App):**
  - Supabase client is initialized in `apps/web/src/lib/supabaseClient.ts` using environment variables:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Authentication and session management are handled in `apps/web/src/contexts/AuthContext.tsx`.
  - OAuth and password login flows are supported.

- **Backend (NestJS App):**
  - Supabase service and module are located in `apps/backend/src/supabase/`.
  - Used for user management, invitations, and authentication guards.
  - Service client is initialized using environment variables (see backend config).

## Environment Variables

Set up the following environment variables in the respective `.env` files:

### Web App (`apps/web/.env`)
```
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
```

### Backend (`apps/backend/.env`)
```
SUPABASE_URL=YOUR_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
```

> Replace `YOUR_SUPABASE_URL`, `YOUR_SUPABASE_ANON_KEY`, and `YOUR_SUPABASE_SERVICE_ROLE_KEY` with your actual Supabase project credentials.

## Getting Started

1. **Install dependencies:**
   ```bash
   pnpm install
   ```
2. **Set up environment variables:**
   - Copy `.env.example` to `.env` in each workspace
   - Fill in the required environment variables as shown above
3. **Start development:**
   ```bash
   pnpm dev
   ```

## Authentication Flow

- Users can sign up or log in using email/password or OAuth (Google).
- The frontend uses Supabase client for authentication and session management.
- The backend validates users and manages invitations using Supabase service client.

## Available Scripts

- `pnpm build` - Build all packages and applications
- `pnpm dev` - Start development mode
- `pnpm lint` - Run linting
- `pnpm test` - Run tests
- `pnpm format` - Format code with Prettier

## Troubleshooting

- Ensure all environment variables are set correctly.
- Check Supabase project settings for correct API keys and URLs.
- For backend issues, verify service role key and Supabase permissions.

## Resources
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [NestJS Documentation](https://docs.nestjs.com)

## License

MIT
