import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Household } from '../entities/household.entity';
import { HouseholdMember, HouseholdRole } from '../entities';
import { User } from '../entities/user.entity';
import { UsersService } from '../users/users.service';
import { HouseholdCacheService } from './household-cache.service';

export interface CreateHouseholdDto {
  name: string;
  description?: string;
  currency?: string;
  settings?: Record<string, any>;
}

export interface UpdateHouseholdDto {
  name?: string;
  description?: string;
  currency?: string;
  settings?: Record<string, any>;
}

export interface AddMemberDto {
  userId: string;
  role?: HouseholdRole;
}

@Injectable()
export class HouseholdsService {
  constructor(
    @InjectRepository(Household)
    private householdsRepository: Repository<Household>,
    @InjectRepository(HouseholdMember)
    private householdMembersRepository: Repository<HouseholdMember>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private usersService: UsersService,
    private householdCacheService: HouseholdCacheService,
  ) { }

  async create(createHouseholdDto: CreateHouseholdDto, ownerId: string, userInfo?: any): Promise<Household> {
    // Ensure user exists in our database
    if (userInfo) {
      await this.usersService.ensureUserExists(userInfo);
    }

    // Create the household
    const household = this.householdsRepository.create(createHouseholdDto);
    const savedHousehold = await this.householdsRepository.save(household);

    // Add the creator as the owner
    const membership = this.householdMembersRepository.create({
      user_id: ownerId,
      household_id: savedHousehold.id,
      role: HouseholdRole.OWNER,
      is_active: true,
      joined_at: new Date(),
    });
    await this.householdMembersRepository.save(membership);

    // Invalidate cache for the owner since they now have a new household
    this.householdCacheService.invalidateUser(ownerId);

    return this.findOne(savedHousehold.id);
  }

  async findAll(): Promise<Household[]> {
    return await this.householdsRepository.find({
      relations: ['members', 'members.user', 'categories'],
    });
  }

  async findOne(id: string): Promise<Household> {
    const household = await this.householdsRepository.findOne({
      where: { id },
      relations: ['members', 'members.user', 'categories', 'receipts'],
    });

    if (!household) {
      throw new NotFoundException(`Household with ID ${id} not found`);
    }

    return household;
  }

  async findUserHouseholds(userId: string): Promise<Household[]> {
    // Check cache first (lazy population pattern)
    const cached = this.householdCacheService.get(userId);
    if (cached) {
      return cached;
    }

    // Cache miss - fetch from database
    const households = await this.householdsRepository
      .createQueryBuilder('household')
      .innerJoin('household.members', 'member')
      .where('member.user_id = :userId', { userId })
      .andWhere('member.is_active = true')
      .leftJoinAndSelect('household.members', 'allMembers')
      .leftJoinAndSelect('allMembers.user', 'user')
      .leftJoinAndSelect('household.categories', 'categories')
      .getMany();

    // Populate cache for next request
    this.householdCacheService.set(userId, households);

    return households;
  }

  async update(id: string, updateHouseholdDto: UpdateHouseholdDto, userId: string): Promise<Household> {
    const household = await this.findOne(id);

    // Check if user has permission to update household
    await this.checkUserPermission(id, userId, [HouseholdRole.OWNER, HouseholdRole.ADMIN]);

    Object.assign(household, updateHouseholdDto);
    await this.householdsRepository.save(household);

    // Invalidate cache for all members since household data changed
    this.householdCacheService.invalidateHousehold(household);

    return this.findOne(id);
  }

  async remove(id: string, userId: string): Promise<void> {
    const household = await this.findOne(id);

    // Only owners can delete households
    await this.checkUserPermission(id, userId, [HouseholdRole.OWNER]);

    // Invalidate cache for all members before removing
    this.householdCacheService.invalidateHousehold(household);

    await this.householdsRepository.remove(household);
  }

  async addMember(householdId: string, addMemberDto: AddMemberDto, requestingUserId: string): Promise<HouseholdMember> {
    // Check if requesting user has permission to add members
    await this.checkUserPermission(householdId, requestingUserId, [HouseholdRole.OWNER, HouseholdRole.ADMIN]);

    // Check if user exists
    const user = await this.usersRepository.findOne({ where: { id: addMemberDto.userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${addMemberDto.userId} not found`);
    }

    // Check if user is already a member
    const existingMembership = await this.householdMembersRepository.findOne({
      where: {
        user_id: addMemberDto.userId,
        household_id: householdId,
      },
    });

    if (existingMembership) {
      if (existingMembership.is_active) {
        throw new ForbiddenException('User is already a member of this household');
      } else {
        // Reactivate membership
        existingMembership.is_active = true;
        existingMembership.role = addMemberDto.role || HouseholdRole.MEMBER;
        existingMembership.joined_at = new Date();

        const savedMembership = await this.householdMembersRepository.save(existingMembership);

        // Invalidate cache for the reactivated member
        this.householdCacheService.invalidateUser(addMemberDto.userId);

        return savedMembership;
      }
    }

    // Create new membership
    const membership = this.householdMembersRepository.create({
      user_id: addMemberDto.userId,
      household_id: householdId,
      role: addMemberDto.role || HouseholdRole.MEMBER,
      is_active: true,
      joined_at: new Date(),
    });

    const savedMembership = await this.householdMembersRepository.save(membership);

    // Invalidate cache for the new member
    this.householdCacheService.invalidateUser(addMemberDto.userId);

    return savedMembership;
  }

  async removeMember(householdId: string, userId: string, requestingUserId: string): Promise<void> {
    // Check if requesting user has permission
    await this.checkUserPermission(householdId, requestingUserId, [HouseholdRole.OWNER, HouseholdRole.ADMIN]);

    const membership = await this.householdMembersRepository.findOne({
      where: {
        user_id: userId,
        household_id: householdId,
        is_active: true,
      },
    });

    if (!membership) {
      throw new NotFoundException('User is not a member of this household');
    }

    // Can't remove the owner
    if (membership.role === HouseholdRole.OWNER) {
      throw new ForbiddenException('Cannot remove the household owner');
    }

    await this.householdMembersRepository.remove(membership);

    // Invalidate cache for the removed member
    this.householdCacheService.invalidateUser(userId);
  }

  async updateMemberRole(
    householdId: string,
    userId: string,
    newRole: HouseholdRole,
    requestingUserId: string
  ): Promise<HouseholdMember> {
    // Only owners can change roles
    await this.checkUserPermission(householdId, requestingUserId, [HouseholdRole.OWNER]);

    const membership = await this.householdMembersRepository.findOne({
      where: {
        user_id: userId,
        household_id: householdId,
        is_active: true,
      },
    });

    if (!membership) {
      throw new NotFoundException('User is not a member of this household');
    }

    membership.role = newRole;
    const savedMembership = await this.householdMembersRepository.save(membership);

    // Invalidate cache for the user whose role changed
    this.householdCacheService.invalidateUser(userId);

    return savedMembership;
  }

  private async checkUserPermission(
    householdId: string,
    userId: string,
    allowedRoles: HouseholdRole[]
  ): Promise<void> {
    const membership = await this.householdMembersRepository.findOne({
      where: {
        user_id: userId,
        household_id: householdId,
        is_active: true,
      },
    });

    if (!membership || !allowedRoles.includes(membership.role)) {
      throw new ForbiddenException('Insufficient permissions for this operation');
    }
  }
} 