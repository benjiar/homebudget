import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateReceiptDto } from './dto/create-receipt.dto';

@Injectable()
export class ReceiptsService {
  constructor(private readonly db: DatabaseService) {}

  async create(createReceiptDto: CreateReceiptDto) {
    return this.db.receipt.create({
      data: createReceiptDto,
    });
  }

  async findAll() {
    return this.db.receipt.findMany({
      include: {
        user: true,
        household: true,
      },
    });
  }

  async findOne(id: string) {
    return this.db.receipt.findUnique({
      where: { id },
      include: {
        user: true,
        household: true,
      },
    });
  }

  async findByUser(userId: string) {
    return this.db.receipt.findMany({
      where: { userId },
      include: {
        household: true,
      },
    });
  }
} 