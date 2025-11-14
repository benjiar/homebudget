import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Household } from './household.entity';
import { Category } from './category.entity';

// Transformer to ensure decimal values are returned as numbers
const DecimalTransformer = {
  to(value: number | null): number | null {
    return value;
  },
  from(value: string | null): number | null {
    return value ? parseFloat(value) : null;
  }
};

export enum BudgetPeriod {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  CUSTOM = 'custom'
}

@Entity('budgets')
@Index(['household_id', 'period', 'start_date'])
@Index(['household_id', 'category_id', 'period'])
export class Budget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: DecimalTransformer
  })
  amount: number;

  @Column({
    type: 'enum',
    enum: BudgetPeriod,
    default: BudgetPeriod.MONTHLY
  })
  period: BudgetPeriod;

  @Column({ type: 'date' })
  start_date: Date;

  @Column({ type: 'date' })
  end_date: Date;

  @Column({ type: 'uuid', nullable: true })
  category_id: string;

  @Column({ type: 'uuid' })
  household_id: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  is_recurring: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relationships
  @ManyToOne(() => Household, household => household.budgets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'household_id' })
  household: Household;

  @ManyToOne(() => Category, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category: Category;
}
