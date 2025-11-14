import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './supabase/supabase.module';
import { UsersModule } from './users/users.module';
import { HouseholdsModule } from './households/households.module';
import { CategoriesModule } from './categories/categories.module';
import { ReceiptsModule } from './receipts/receipts.module';
import { InvitationsModule } from './invitations/invitations.module';
import { BudgetsModule } from './budgets/budgets.module';
import { User, Household, HouseholdMember, Category, Receipt, Invitation, Budget } from './entities';

@Module({
  imports: [
    // Global configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database configuration with async loading
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('POSTGRES_HOST'),
        port: parseInt(configService.get('POSTGRES_PORT') || '5432'),
        database: configService.get('POSTGRES_DATABASE'),
        username: configService.get('POSTGRES_USER'),
        password: configService.get('POSTGRES_PASSWORD'),
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
        entities: [User, Household, HouseholdMember, Category, Receipt, Invitation, Budget],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        ssl: {
          rejectUnauthorized: false, // Required for Supabase
        },
      }),
      inject: [ConfigService],
    }),

    // Supabase module
    SupabaseModule,

    // Feature modules
    UsersModule,
    HouseholdsModule,
    CategoriesModule,
    ReceiptsModule,
    InvitationsModule,
    BudgetsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
