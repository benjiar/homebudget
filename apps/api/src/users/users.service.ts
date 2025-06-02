import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}

  async create(createUserDto: CreateUserDto) {
    return this.db.user.create({
      data: createUserDto,
    });
  }

  async findAll() {
    return this.db.user.findMany();
  }

  async findOne(id: string) {
    return this.db.user.findUnique({
      where: { id },
      include: {
        receipts: true,
        household: true,
      },
    });
  }
} 