import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Household } from './household.entity';
import { HouseholdRole } from './enums';

@Entity('household_members')
export class HouseholdMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'uuid' })
  household_id: string;

  @Column({ 
    type: 'enum', 
    enum: HouseholdRole,
    default: HouseholdRole.MEMBER 
  })
  role: HouseholdRole;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'timestamp', nullable: true })
  invited_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  joined_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relationships
  @ManyToOne(() => User, user => user.household_memberships)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Household, household => household.members)
  @JoinColumn({ name: 'household_id' })
  household: Household;
} 