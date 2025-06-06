import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { HouseholdMember } from './household-member.entity';
import { Receipt } from './receipt.entity';
import { Category } from './category.entity';
import { Invitation } from './invitation.entity';

@Entity('households')
export class Household {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 10, default: 'ILS' })
  currency: string;

  @Column({ type: 'jsonb', nullable: true })
  settings: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relationships
  @OneToMany(() => HouseholdMember, householdMember => householdMember.household)
  members: HouseholdMember[];

  @OneToMany(() => Receipt, receipt => receipt.household)
  receipts: Receipt[];

  @OneToMany(() => Category, category => category.household)
  categories: Category[];

  @OneToMany(() => Invitation, invitation => invitation.household)
  invitations: Invitation[];
} 