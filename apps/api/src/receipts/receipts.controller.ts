import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ReceiptsService } from './receipts.service';
import { CreateReceiptDto } from './dto/create-receipt.dto';

@Controller('receipts')
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Post()
  create(@Body() createReceiptDto: CreateReceiptDto) {
    return this.receiptsService.create(createReceiptDto);
  }

  @Get()
  findAll() {
    return this.receiptsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.receiptsService.findOne(id);
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.receiptsService.findByUser(userId);
  }
} 