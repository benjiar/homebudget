import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateBudgetsTable1733800000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create budgets table
        await queryRunner.createTable(
            new Table({
                name: 'budgets',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'name',
                        type: 'varchar',
                        length: '255',
                    },
                    {
                        name: 'description',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'amount',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                    },
                    {
                        name: 'period',
                        type: 'enum',
                        enum: ['monthly', 'yearly', 'custom'],
                        default: "'monthly'",
                    },
                    {
                        name: 'start_date',
                        type: 'date',
                    },
                    {
                        name: 'end_date',
                        type: 'date',
                    },
                    {
                        name: 'category_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'household_id',
                        type: 'uuid',
                    },
                    {
                        name: 'is_active',
                        type: 'boolean',
                        default: true,
                    },
                    {
                        name: 'is_recurring',
                        type: 'boolean',
                        default: false,
                    },
                    {
                        name: 'metadata',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true,
        );

        // Add foreign key to households table
        await queryRunner.createForeignKey(
            'budgets',
            new TableForeignKey({
                columnNames: ['household_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'households',
                onDelete: 'CASCADE',
            }),
        );

        // Add foreign key to categories table
        await queryRunner.createForeignKey(
            'budgets',
            new TableForeignKey({
                columnNames: ['category_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'categories',
                onDelete: 'SET NULL',
            }),
        );

        // Create indexes for efficient queries
        await queryRunner.createIndex(
            'budgets',
            new TableIndex({
                name: 'IDX_budgets_household_period_start',
                columnNames: ['household_id', 'period', 'start_date'],
            }),
        );

        await queryRunner.createIndex(
            'budgets',
            new TableIndex({
                name: 'IDX_budgets_household_category_period',
                columnNames: ['household_id', 'category_id', 'period'],
            }),
        );

        await queryRunner.createIndex(
            'budgets',
            new TableIndex({
                name: 'IDX_budgets_dates',
                columnNames: ['start_date', 'end_date'],
            }),
        );

        await queryRunner.createIndex(
            'budgets',
            new TableIndex({
                name: 'IDX_budgets_active',
                columnNames: ['is_active'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.dropIndex('budgets', 'IDX_budgets_active');
        await queryRunner.dropIndex('budgets', 'IDX_budgets_dates');
        await queryRunner.dropIndex('budgets', 'IDX_budgets_household_category_period');
        await queryRunner.dropIndex('budgets', 'IDX_budgets_household_period_start');

        // Drop foreign keys
        const table = await queryRunner.getTable('budgets');
        const householdForeignKey = table.foreignKeys.find(
            fk => fk.columnNames.indexOf('household_id') !== -1,
        );
        const categoryForeignKey = table.foreignKeys.find(
            fk => fk.columnNames.indexOf('category_id') !== -1,
        );

        if (householdForeignKey) {
            await queryRunner.dropForeignKey('budgets', householdForeignKey);
        }
        if (categoryForeignKey) {
            await queryRunner.dropForeignKey('budgets', categoryForeignKey);
        }

        // Drop table
        await queryRunner.dropTable('budgets');
    }
}
