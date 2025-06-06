import { DataSource } from 'typeorm';
import { User, Household, HouseholdMember, Category, Receipt, Invitation } from './entities';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DATABASE,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  synchronize: false,
  logging: false,
  entities: [User, Household, HouseholdMember, Category, Receipt, Invitation],
  migrations: ['src/migrations/*{.ts,.js}'],
  ssl: {
    rejectUnauthorized: false, // Required for Supabase
  },
}); 