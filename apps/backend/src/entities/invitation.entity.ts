import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Household } from './household.entity';
import { User } from './user.entity';
import { HouseholdRole } from './enums';

@Entity('invitations')
export class Invitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'uuid' })
  household_id: string;

  @Column({ 
    type: 'enum', 
    enum: HouseholdRole,
    default: 'member'
  })
  role: HouseholdRole;

  @Column({ type: 'uuid' })
  invited_by: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  invited_at: Date;

  @Column({ type: 'timestamp' })
  expires_at: Date;

  @Column({ type: 'boolean', default: false })
  is_accepted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  accepted_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relationships
  @ManyToOne(() => Household, household => household.invitations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'household_id' })
  household: Household;

  @ManyToOne(() => User, user => user.sent_invitations)
  @JoinColumn({ name: 'invited_by' })
  invited_by_user: User;
} 