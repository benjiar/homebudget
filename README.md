# HomeBudget

A modern expense tracking application that automatically processes receipts from your email inbox.

## 🚀 Features

- **Email Integration**: Automatically fetches and processes receipts from your email
- **Expense Tracking**: Categorize and track your expenses
- **Household Management**: Share expenses with household members
- **Modern Stack**: Built with Next.js, NestJS, and PostgreSQL

## 🏗️ Project Structure

This is a monorepo using Turborepo, containing the following packages:

### Apps

- **Web** (`apps/web`): Next.js frontend application
- **API** (`apps/api`): NestJS backend API
- **Worker** (`apps/worker`): Background worker for email processing

### Packages

- **Parser** (`packages/parser`): Email and receipt parsing utilities
- **Auth** (`packages/auth`): Authentication utilities

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 with App Router
- **Backend**: NestJS
- **Database**: PostgreSQL with Prisma ORM
- **Email Processing**: NodeMailer
- **Authentication**: JWT
- **Build System**: Turborepo

## 🚦 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- Supabase account (for database hosting)

### Installation

1. Clone the repository:
   ```bash
   git clone git@github.com:benjamin-arbibe_sfrt/homebudget.git
   cd homebudget
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in the `apps/api` directory
   - Update the `DATABASE_URL` with your Supabase credentials

4. Initialize the database:
   ```bash
   cd apps/api
   npm run prisma:generate
   npm run prisma:push
   ```

5. Start the development servers:
   ```bash
   cd ../..
   npm run dev
   ```

## 📝 Available Scripts

- `npm run dev` - Start all applications in development mode
- `npm run build` - Build all applications
- `npm run lint` - Run linting for all packages
- `npm run format` - Format all code with Prettier

## 🔄 Development Workflow

1. Create a new branch for your feature
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## 📚 Documentation

For more detailed information about features and implementation status, see [FEATURES.md](./FEATURES.md).

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.