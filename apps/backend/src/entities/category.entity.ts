import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Household } from './household.entity';
import { Receipt } from './receipt.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  color: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  icon: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  monthly_budget: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  is_system: boolean; // For default categories that can't be deleted

  @Column({ type: 'uuid' })
  household_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relationships
  @ManyToOne(() => Household, household => household.categories)
  @JoinColumn({ name: 'household_id' })
  household: Household;

  @OneToMany(() => Receipt, receipt => receipt.category)
  receipts: Receipt[];
} 