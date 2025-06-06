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

## Getting Started

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Set up environment variables:

   - Copy `.env.example` to `.env` in each workspace
   - Fill in the required environment variables

3. Start development:
   ```bash
   pnpm dev
   ```

## Available Scripts

- `pnpm build` - Build all packages and applications
- `pnpm dev` - Start development mode
- `pnpm lint` - Run linting
- `pnpm test` - Run tests
- `pnpm format` - Format code with Prettier

## License

MIT
