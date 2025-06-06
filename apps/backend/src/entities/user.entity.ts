import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { HouseholdMember } from './household-member.entity';
import { Receipt } from './receipt.entity';
import { Invitation } from './invitation.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  full_name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatar_url: string;

  @Column({ type: 'jsonb', nullable: true })
  preferences: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relationships
  @OneToMany(() => HouseholdMember, householdMember => householdMember.user)
  household_memberships: HouseholdMember[];

  @OneToMany(() => Receipt, receipt => receipt.created_by)
  receipts: Receipt[];

  @OneToMany(() => Invitation, invitation => invitation.invited_by_user)
  sent_invitations: Invitation[];
} 