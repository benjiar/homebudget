import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Household } from './household.entity';
import { Category } from './category.entity';
import { User } from './user.entity';

// Transformer to ensure decimal values are returned as numbers
const DecimalTransformer = {
  to(value: number): number {
    return value;
  },
  from(value: string): number {
    return parseFloat(value);
  }
};

@Entity('receipts')
export class Receipt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: DecimalTransformer
  })
  amount: number;

  @Column({ type: 'date' })
  receipt_date: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  photo_url: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>; // For storing additional data like OCR results, etc.

  @Column({ type: 'uuid' })
  household_id: string;

  @Column({ type: 'uuid' })
  category_id: string;

  @Column({ type: 'uuid' })
  created_by_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relationships
  @ManyToOne(() => Household, household => household.receipts)
  @JoinColumn({ name: 'household_id' })
  household: Household;

  @ManyToOne(() => Category, category => category.receipts)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @ManyToOne(() => User, user => user.receipts)
  @JoinColumn({ name: 'created_by_id' })
  created_by: User;
} 