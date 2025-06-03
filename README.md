# HomeBudget

A modern, type-safe expense tracking application built with Next.js, NestJS, and tRPC.

## Features

- 🏠 Household management
- 💰 Expense tracking
- 📊 Financial analytics
- 👥 Multi-user support
- 🔒 Secure authentication
- 📱 Mobile-friendly
- 🔄 Type-safe API with tRPC

## Tech Stack

- **Frontend**: Next.js, React, TypeScript
- **Backend**: NestJS, tRPC
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Supabase Auth
- **API**: tRPC for type-safe communication
- **Mobile**: Expo (coming soon)

## Project Structure

```
homebudget/
├── apps/
│   ├── web/          # Next.js frontend
│   ├── api/          # NestJS + tRPC backend
│   └── mobile/       # Expo mobile app (coming soon)
├── packages/
│   ├── db/           # Database schema and migrations
│   └── shared/       # Shared types and utilities
└── package.json
```

## Type-Safe API with tRPC

This project uses tRPC for type-safe API communication between the frontend and backend. Key benefits:

- 🎯 End-to-end type safety
- 🚀 No code generation needed
- 📝 Automatic type inference
- 🔍 Great developer experience
- 🛡️ Runtime type safety

### Example Usage

```typescript
// Backend (NestJS + tRPC)
@trpc.router()
export class HouseholdRouter {
  @trpc.query()
  async getHouseholds(ctx: Context) {
    return this.householdService.getUserHouseholds(ctx.user.id);
  }

  @trpc.mutation()
  async createHousehold(
    ctx: Context,
    input: { name: string }
  ) {
    return this.householdService.createHousehold(ctx.user.id, input.name);
  }
}

// Frontend (Next.js)
const { data: households } = api.household.getAll.useQuery();
const createHousehold = api.household.create.useMutation();
```

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Set up environment variables:
   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   ```
4. Start the development servers:
   ```bash
   pnpm dev
   ```

## Development

- `pnpm dev` - Start all services in development mode
- `pnpm build` - Build all packages and applications
- `pnpm test` - Run tests
- `pnpm lint` - Run linting
- `pnpm format` - Format code

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT