import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { households, householdMembers, users } from '@homebudget/db';
import { eq, and } from 'drizzle-orm';
import { CreateHouseholdInput, UpdateHouseholdInput, HouseholdWithMembers } from './types';

@Injectable()
export class HouseholdsService {
  constructor(private readonly db: DatabaseService) {}

  async createHousehold(userId: string, input: CreateHouseholdInput) {
    const [household] = await this.db
      .insert(households)
      .values({
        name: input.name,
        ownerId: userId,
        settings: {
          currency: 'USD',
          defaultCategories: ['Food', 'Transport', 'Utilities', 'Entertainment'],
        },
      })
      .returning();

    // Add the creator as the owner
    await this.db.insert(householdMembers).values({
      householdId: household.id,
      userId,
      role: 'owner',
    });

    return household;
  }

  async getHousehold(userId: string, householdId: string): Promise<HouseholdWithMembers> {
    const household = await this.db.query.households.findFirst({
      where: eq(households.id, householdId),
      with: {
        members: {
          with: {
            user: true,
          },
        },
      },
    });

    if (!household) {
      throw new NotFoundException('Household not found');
    }

    // Check if user is a member
    const isMember = household.members.some((member) => member.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this household');
    }

    return household;
  }

  async getUserHouseholds(userId: string): Promise<HouseholdWithMembers[]> {
    const userHouseholds = await this.db.query.householdMembers.findMany({
      where: eq(householdMembers.userId, userId),
      with: {
        household: {
          with: {
            members: {
              with: {
                user: true,
              },
            },
          },
        },
      },
    });

    return userHouseholds.map((member) => member.household);
  }

  async updateHousehold(userId: string, householdId: string, data: UpdateHouseholdInput) {
    const household = await this.getHousehold(userId, householdId);
    
    // Check if user is the owner
    const isOwner = household.members.some(
      (member) => member.userId === userId && member.role === 'owner'
    );
    if (!isOwner) {
      throw new ForbiddenException('Only the owner can update household settings');
    }

    const [updated] = await this.db
      .update(households)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(households.id, householdId))
      .returning();

    return updated;
  }

  async inviteMember(userId: string, householdId: string, email: string) {
    const household = await this.getHousehold(userId, householdId);
    
    // Check if user is the owner
    const isOwner = household.members.some(
      (member) => member.userId === userId && member.role === 'owner'
    );
    if (!isOwner) {
      throw new ForbiddenException('Only the owner can invite members');
    }

    // Find the user by email
    const user = await this.db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is already a member
    const existingMember = await this.db.query.householdMembers.findFirst({
      where: and(
        eq(householdMembers.householdId, householdId),
        eq(householdMembers.userId, user.id)
      ),
    });

    if (existingMember) {
      throw new ForbiddenException('User is already a member of this household');
    }

    // Add the user as a member
    const [member] = await this.db
      .insert(householdMembers)
      .values({
        householdId,
        userId: user.id,
        role: 'member',
      })
      .returning();

    return member;
  }

  async removeMember(userId: string, householdId: string, memberId: string) {
    const household = await this.getHousehold(userId, householdId);
    
    // Check if user is the owner
    const isOwner = household.members.some(
      (member) => member.userId === userId && member.role === 'owner'
    );
    if (!isOwner) {
      throw new ForbiddenException('Only the owner can remove members');
    }

    // Don't allow removing the owner
    if (memberId === household.ownerId) {
      throw new ForbiddenException('Cannot remove the household owner');
    }

    const [removed] = await this.db
      .delete(householdMembers)
      .where(
        and(
          eq(householdMembers.householdId, householdId),
          eq(householdMembers.userId, memberId)
        )
      )
      .returning();

    return removed;
  }

  async leaveHousehold(userId: string, householdId: string) {
    const household = await this.getHousehold(userId, householdId);
    
    // Don't allow the owner to leave
    if (household.ownerId === userId) {
      throw new ForbiddenException('The owner cannot leave the household. Transfer ownership first.');
    }

    const [removed] = await this.db
      .delete(householdMembers)
      .where(
        and(
          eq(householdMembers.householdId, householdId),
          eq(householdMembers.userId, userId)
        )
      )
      .returning();

    return removed;
  }
} 