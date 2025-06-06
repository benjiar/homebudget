import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Delete, 
  Query, 
  UseGuards, 
  Request,
  Patch,
  ParseIntPipe,
  DefaultValuePipe,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { SupabaseAuthGuard } from '../supabase/supabase-auth.guard';
import { ReceiptsService, CreateReceiptDto, UpdateReceiptDto, ReceiptFilters } from './receipts.service';
import { Receipt } from '../entities/receipt.entity';

@Controller('receipts')
@UseGuards(SupabaseAuthGuard)
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Post()
  async create(@Body() createReceiptDto: CreateReceiptDto, @Request() req: any): Promise<Receipt> {
    return this.receiptsService.create(createReceiptDto, req.user.id);
  }

  @Get('household/:householdId')
  async findByHousehold(
    @Param('householdId') householdId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('categoryIds') categoryIds?: string | string[],
    @Query('minAmount') minAmount?: string,
    @Query('maxAmount') maxAmount?: string,
    @Query('search') search?: string,
  ) {
    const filters: ReceiptFilters = {};
    
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (categoryIds) {
      filters.categoryIds = Array.isArray(categoryIds) ? categoryIds : [categoryIds];
    }
    if (minAmount) filters.minAmount = parseFloat(minAmount);
    if (maxAmount) filters.maxAmount = parseFloat(maxAmount);
    if (search) filters.search = search;

    return this.receiptsService.findByHousehold(householdId, filters, page, limit);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Receipt> {
    return this.receiptsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string, 
    @Body() updateReceiptDto: UpdateReceiptDto, 
    @Request() req: any
  ): Promise<Receipt> {
    return this.receiptsService.update(id, updateReceiptDto, req.user.id);
  }

  @Post(':id/photo')
  @UseInterceptors(FileInterceptor('photo'))
  async uploadPhoto(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Request() req: any
  ): Promise<Receipt> {
    return this.receiptsService.uploadPhoto(id, file, req.user.id);
  }

  @Delete(':id/photo')
  async deletePhoto(
    @Param('id') id: string,
    @Request() req: any
  ): Promise<Receipt> {
    return this.receiptsService.deletePhoto(id, req.user.id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any): Promise<void> {
    return this.receiptsService.remove(id, req.user.id);
  }

  @Get('household/:householdId/monthly-report')
  async getMonthlyReport(
    @Param('householdId') householdId: string,
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
  ) {
    return this.receiptsService.getMonthlyReport(householdId, month, year);
  }

  @Get('household/:householdId/category/:categoryId')
  async getReceiptsByCategory(
    @Param('householdId') householdId: string,
    @Param('categoryId') categoryId: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<Receipt[]> {
    return this.receiptsService.getReceiptsByCategory(householdId, categoryId, limit);
  }

  @Get('household/:householdId/expenses-by-date')
  async getExpensesByDateRange(
    @Param('householdId') householdId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.receiptsService.getExpensesByDateRange(
      householdId, 
      new Date(startDate), 
      new Date(endDate)
    );
  }
} 