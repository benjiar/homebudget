import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInitialSchema1733574500000 implements MigrationInterface {
    name = 'CreateInitialSchema1733574500000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create households table
        await queryRunner.query(`
            CREATE TABLE "households" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "description" text,
                "currency" character varying(10) NOT NULL DEFAULT 'USD',
                "settings" jsonb,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_households" PRIMARY KEY ("id")
            )
        `);

        // Create users table
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying(255) NOT NULL,
                "full_name" character varying(255),
                "avatar_url" character varying(255),
                "preferences" jsonb,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_users" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_users_email" UNIQUE ("email")
            )
        `);

        // Create household_members table
        await queryRunner.query(`
            CREATE TYPE "household_members_role_enum" AS ENUM('owner', 'admin', 'member', 'viewer')
        `);
        
        await queryRunner.query(`
            CREATE TABLE "household_members" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "household_id" uuid NOT NULL,
                "role" "household_members_role_enum" NOT NULL DEFAULT 'member',
                "is_active" boolean NOT NULL DEFAULT true,
                "invited_at" TIMESTAMP,
                "joined_at" TIMESTAMP,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_household_members" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_household_members_user_household" UNIQUE ("user_id", "household_id")
            )
        `);

        // Create categories table
        await queryRunner.query(`
            CREATE TABLE "categories" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "description" text,
                "color" character varying(50),
                "icon" character varying(50),
                "monthly_budget" numeric(10,2),
                "is_active" boolean NOT NULL DEFAULT true,
                "is_system" boolean NOT NULL DEFAULT false,
                "household_id" uuid NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_categories" PRIMARY KEY ("id")
            )
        `);

        // Create receipts table
        await queryRunner.query(`
            CREATE TABLE "receipts" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "title" character varying(255) NOT NULL,
                "amount" numeric(10,2) NOT NULL,
                "receipt_date" date NOT NULL,
                "notes" text,
                "photo_url" character varying(500),
                "metadata" jsonb,
                "household_id" uuid NOT NULL,
                "category_id" uuid NOT NULL,
                "created_by_id" uuid NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_receipts" PRIMARY KEY ("id")
            )
        `);

        // Add foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "household_members" 
            ADD CONSTRAINT "FK_household_members_user" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "household_members" 
            ADD CONSTRAINT "FK_household_members_household" 
            FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "categories" 
            ADD CONSTRAINT "FK_categories_household" 
            FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "receipts" 
            ADD CONSTRAINT "FK_receipts_household" 
            FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "receipts" 
            ADD CONSTRAINT "FK_receipts_category" 
            FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT
        `);

        await queryRunner.query(`
            ALTER TABLE "receipts" 
            ADD CONSTRAINT "FK_receipts_created_by" 
            FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE
        `);

        // Create indexes for better performance
        await queryRunner.query(`CREATE INDEX "IDX_household_members_user_id" ON "household_members" ("user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_household_members_household_id" ON "household_members" ("household_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_categories_household_id" ON "categories" ("household_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_receipts_household_id" ON "receipts" ("household_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_receipts_category_id" ON "receipts" ("category_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_receipts_created_by_id" ON "receipts" ("created_by_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_receipts_receipt_date" ON "receipts" ("receipt_date")`);

        // Insert default categories
        await queryRunner.query(`
            INSERT INTO "categories" ("id", "name", "description", "color", "icon", "is_system", "household_id")
            SELECT 
                uuid_generate_v4(),
                category_data.name,
                category_data.description,
                category_data.color,
                category_data.icon,
                true,
                h.id
            FROM "households" h
            CROSS JOIN (
                VALUES 
                ('Food & Groceries', 'Food, groceries, and dining expenses', '#4CAF50', 'utensils'),
                ('Utilities', 'Electricity, water, gas, internet, phone', '#2196F3', 'zap'),
                ('Rent & Housing', 'Rent, mortgage, property taxes, insurance', '#FF9800', 'home'),
                ('Transportation', 'Gas, public transport, car maintenance', '#9C27B0', 'car'),
                ('Healthcare', 'Medical expenses, insurance, pharmacy', '#F44336', 'heart'),
                ('Childcare', 'Daycare, babysitting, child-related expenses', '#FFEB3B', 'baby'),
                ('Entertainment', 'Movies, games, subscriptions, hobbies', '#E91E63', 'play'),
                ('Shopping', 'Clothing, household items, personal care', '#607D8B', 'shopping-bag'),
                ('Other', 'Miscellaneous expenses', '#9E9E9E', 'more-horizontal')
            ) AS category_data(name, description, color, icon)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys first
        await queryRunner.query(`ALTER TABLE "receipts" DROP CONSTRAINT "FK_receipts_created_by"`);
        await queryRunner.query(`ALTER TABLE "receipts" DROP CONSTRAINT "FK_receipts_category"`);
        await queryRunner.query(`ALTER TABLE "receipts" DROP CONSTRAINT "FK_receipts_household"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_categories_household"`);
        await queryRunner.query(`ALTER TABLE "household_members" DROP CONSTRAINT "FK_household_members_household"`);
        await queryRunner.query(`ALTER TABLE "household_members" DROP CONSTRAINT "FK_household_members_user"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "receipts"`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`DROP TABLE "household_members"`);
        await queryRunner.query(`DROP TYPE "household_members_role_enum"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "households"`);
    }
} 