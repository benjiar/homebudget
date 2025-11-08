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
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { SupabaseAuthGuard } from '../supabase/supabase-auth.guard';
import {
  ReceiptsService,
  CreateReceiptDto,
  UpdateReceiptDto,
  ReceiptFilters,
} from './receipts.service';
import { Receipt } from '../entities/receipt.entity';
import { HouseholdHeader } from '../common/decorators/household-header.decorator';

@UseGuards(SupabaseAuthGuard)
@Controller('receipts')
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) { }

  // Create new receipt
  @Post()
  async create(
    @Body() createReceiptDto: CreateReceiptDto,
    @Request() req: any,
  ): Promise<Receipt> {
    return this.receiptsService.create(createReceiptDto, req.user.id);
  }

  // Get receipts by household(s)
  @Get()
  async findByHouseholds(
    @HouseholdHeader() householdIds: string[],
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('categoryIds') categoryIds?: string | string[],
    @Query('minAmount') minAmount?: string,
    @Query('maxAmount') maxAmount?: string,
    @Query('search') search?: string,
    @Request() req?: any,
  ) {
    const filters: ReceiptFilters = {};

    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (categoryIds)
      filters.categoryIds = Array.isArray(categoryIds)
        ? categoryIds
        : [categoryIds];
    if (minAmount) filters.minAmount = parseFloat(minAmount);
    if (maxAmount) filters.maxAmount = parseFloat(maxAmount);
    if (search) filters.search = search;

    return this.receiptsService.findByHouseholdIds(
      householdIds,
      filters,
      page,
      limit,
      req.user.id,
    );
  }

  // Get a single receipt by ID
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Receipt> {
    return this.receiptsService.findOne(id);
  }

  // Update receipt
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateReceiptDto: UpdateReceiptDto,
    @Request() req: any,
  ): Promise<Receipt> {
    return this.receiptsService.update(id, updateReceiptDto, req.user.id);
  }

  // Upload photo for a receipt
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
    @Request() req: any,
  ): Promise<Receipt> {
    return this.receiptsService.uploadPhoto(id, file, req.user.id);
  }

  // Delete photo from receipt
  @Delete(':id/photo')
  async deletePhoto(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<Receipt> {
    return this.receiptsService.deletePhoto(id, req.user.id);
  }

  // Delete receipt
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<void> {
    return this.receiptsService.remove(id, req.user.id);
  }

  // Reports
  @Get('monthly-report')
  async getMonthlyReport(
    @HouseholdHeader() householdIds: string[],
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
    @Request() req: any,
  ) {
    return this.receiptsService.getMonthlyReportForHouseholds(
      householdIds,
      month,
      year,
      req.user.id,
    );
  }

  // Category filters
  @Get('category/:categoryId')
  async getReceiptsByCategory(
    @HouseholdHeader() householdIds: string[],
    @Param('categoryId') categoryId: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Request() req: any,
  ): Promise<Receipt[]> {
    return this.receiptsService.getReceiptsByCategoryMultiple(
      householdIds,
      categoryId,
      limit,
      req.user.id,
    );
  }

  // Expense reports by date
  @Get('expenses-by-date')
  async getExpensesByDateRange(
    @HouseholdHeader() householdIds: string[],
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req: any,
  ) {
    return this.receiptsService.getExpensesByDateRangeMultiple(
      householdIds,
      new Date(startDate),
      new Date(endDate),
      req.user.id,
    );
  }
}
