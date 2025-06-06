import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

export interface CreateUserDto {
  email: string;
  full_name?: string;
  avatar_url?: string;
  preferences?: Record<string, any>;
}

export interface UpdateUserDto {
  full_name?: string;
  avatar_url?: string;
  preferences?: Record<string, any>;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create(createUserDto);
    return await this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return await this.usersRepository.find({
      relations: ['household_memberships', 'household_memberships.household'],
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['household_memberships', 'household_memberships.household', 'receipts'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { email },
      relations: ['household_memberships', 'household_memberships.household'],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    
    Object.assign(user, updateUserDto);
    return await this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  async getUserHouseholds(userId: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: [
        'household_memberships',
        'household_memberships.household',
        'household_memberships.household.categories',
      ],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user;
  }

  /**
   * Ensure user exists in database from Supabase auth data
   * Creates user if they don't exist
   */
  async ensureUserExists(supabaseUser: any): Promise<User> {
    // Check if user already exists
    let user = await this.usersRepository.findOne({ where: { id: supabaseUser.id } });
    
    if (!user) {
      // Create user from Supabase auth data
      const createUserDto = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        full_name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || '',
        avatar_url: supabaseUser.user_metadata?.avatar_url || null,
        preferences: {},
      };
      
      user = this.usersRepository.create(createUserDto);
      user = await this.usersRepository.save(user);
      
      console.log(`✅ Created user in database: ${user.email}`);
    }
    
    return user;
  }
} 