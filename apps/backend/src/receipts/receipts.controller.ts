import {
  Controller,
  Get,
  Post,
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
import { ReceiptsService, ReceiptFilters } from './receipts.service';
import { CreateReceiptDto } from './dto/create-receipt.dto';
import { UpdateReceiptDto } from './dto/update-receipt.dto';
import { Receipt } from '../entities/receipt.entity';
import { HouseholdHeader } from '../common/decorators/household-header.decorator';

@UseGuards(SupabaseAuthGuard)
@Controller('receipts')
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) { }

  // Create new receipt (with optional photo upload)
  @Post()
  @UseInterceptors(FileInterceptor('photo'))
  async create(
    @Request() req: any,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 15 * 1024 * 1024 }), // 15MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp|pdf)$/ }),
        ],
        fileIsRequired: false,
      }),
    )
    photo: Express.Multer.File,
  ): Promise<Receipt> {
    console.log('=== CREATE RECEIPT REQUEST ===');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Body fields:', Object.keys(req.body));
    console.log('Body content:', JSON.stringify(req.body, null, 2));
    console.log('Photo file:', photo ? {
      fieldname: photo.fieldname,
      originalname: photo.originalname,
      mimetype: photo.mimetype,
      size: photo.size,
    } : 'No photo');
    console.log('User ID:', req.user?.id);

    // Extract and transform FormData fields from request body
    const body = req.body;

    const createReceiptDto: CreateReceiptDto = {
      title: body.title,
      amount: parseFloat(body.amount),
      receipt_date: body.receipt_date,
      notes: body.notes && body.notes !== 'undefined' ? body.notes : undefined,
      household_id: body.household_id,
      category_id: body.category_id,
      photo_url: body.photo_url,
      metadata: body.metadata,
    };

    console.log('Transformed DTO:', JSON.stringify(createReceiptDto, null, 2));

    try {
      const result = await this.receiptsService.create(createReceiptDto, req.user.id, photo);
      console.log('Receipt created successfully:', result.id);
      return result;
    } catch (error) {
      console.error('Error creating receipt:', error);
      throw error;
    }
  }  // Get receipts by household(s)
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

  // Update receipt (with optional photo upload)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('photo'))
  async update(
    @Param('id') id: string,
    @Request() req: any,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 15 * 1024 * 1024 }), // 15MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp|pdf)$/ }),
        ],
        fileIsRequired: false,
      }),
    )
    photo: Express.Multer.File,
  ): Promise<Receipt> {
    // Extract and transform FormData fields from request body
    const body = req.body;
    const updateReceiptDto: UpdateReceiptDto = {};

    if (body.title !== undefined) updateReceiptDto.title = body.title;
    if (body.amount !== undefined) updateReceiptDto.amount = parseFloat(body.amount);
    if (body.receipt_date !== undefined) updateReceiptDto.receipt_date = body.receipt_date;
    if (body.notes !== undefined && body.notes !== 'undefined') updateReceiptDto.notes = body.notes;
    if (body.category_id !== undefined) updateReceiptDto.category_id = body.category_id;
    if (body.photo_url !== undefined) updateReceiptDto.photo_url = body.photo_url;
    if (body.metadata !== undefined) updateReceiptDto.metadata = body.metadata;

    return this.receiptsService.update(id, updateReceiptDto, req.user.id, photo);
  }

  // Upload photo/document for a receipt
  @Post(':id/photo')
  @UseInterceptors(FileInterceptor('photo'))
  async uploadPhoto(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 15 * 1024 * 1024 }), // 15MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp|pdf)$/ }),
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
