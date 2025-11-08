import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Receipt } from '../entities/receipt.entity';
import { Category } from '../entities/category.entity';
import { SupabaseService } from '../supabase/supabase.service';
import { HouseholdAccessService } from '../common/services/household-access.service';

export interface CreateReceiptDto {
  title: string;
  amount: number;
  receipt_date: Date;
  notes?: string;
  photo_url?: string;
  metadata?: Record<string, any>;
  household_id: string;
  category_id: string;
}

export interface UpdateReceiptDto {
  title?: string;
  amount?: number;
  receipt_date?: Date;
  notes?: string;
  photo_url?: string;
  metadata?: Record<string, any>;
  category_id?: string;
}

export interface ReceiptFilters {
  startDate?: Date;
  endDate?: Date;
  categoryIds?: string[];
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

export interface ReceiptSummary {
  total_receipts: number;
  total_amount: number;
  average_amount: number;
  by_category: Array<{
    category: Category;
    count: number;
    total: number;
  }>;
}

@Injectable()
export class ReceiptsService {
  constructor(
    @InjectRepository(Receipt)
    private receiptsRepository: Repository<Receipt>,
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
    private supabaseService: SupabaseService,
    private householdAccessService: HouseholdAccessService,
  ) { }

  async create(createReceiptDto: CreateReceiptDto, userId: string): Promise<Receipt> {
    // Check if user has permission to add receipts to this household
    await this.householdAccessService.checkCanManageResources(
      createReceiptDto.household_id,
      userId
    );

    // Verify category belongs to the household
    const category = await this.categoriesRepository.findOne({
      where: {
        id: createReceiptDto.category_id,
        household_id: createReceiptDto.household_id,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found or does not belong to this household');
    }

    const receipt = this.receiptsRepository.create({
      ...createReceiptDto,
      created_by_id: userId,
    });

    return await this.receiptsRepository.save(receipt);
  }

  async findByHousehold(
    householdId: string,
    filters: ReceiptFilters = {},
    page = 1,
    limit = 50
  ): Promise<{ receipts: Receipt[]; total: number; summary: ReceiptSummary }> {
    const queryBuilder = this.receiptsRepository
      .createQueryBuilder('receipt')
      .leftJoinAndSelect('receipt.category', 'category')
      .leftJoinAndSelect('receipt.created_by', 'user')
      .where('receipt.household_id = :householdId', { householdId })
      .orderBy('receipt.receipt_date', 'DESC');

    // Apply filters
    if (filters.startDate && filters.endDate) {
      queryBuilder.andWhere('receipt.receipt_date BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    if (filters.categoryIds && filters.categoryIds.length > 0) {
      queryBuilder.andWhere('receipt.category_id IN (:...categoryIds)', {
        categoryIds: filters.categoryIds,
      });
    }

    if (filters.minAmount !== undefined) {
      queryBuilder.andWhere('receipt.amount >= :minAmount', { minAmount: filters.minAmount });
    }

    if (filters.maxAmount !== undefined) {
      queryBuilder.andWhere('receipt.amount <= :maxAmount', { maxAmount: filters.maxAmount });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(receipt.title ILIKE :search OR receipt.notes ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    // Get total count for pagination
    const total = await queryBuilder.getCount();

    // Apply pagination
    const receipts = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    // Generate summary
    const summary = await this.generateSummary(householdId, filters);

    return { receipts, total, summary };
  }

  async findByHouseholdIds(
    householdIds: string[],
    filters: ReceiptFilters = {},
    page = 1,
    limit = 50,
    userId: string
  ): Promise<{ receipts: Receipt[]; total: number; summary: ReceiptSummary }> {
    // Get accessible household IDs (validates access and returns all if empty)
    const accessibleHouseholdIds = await this.householdAccessService.validateAndGetHouseholdIds(
      householdIds,
      userId
    );

    if (accessibleHouseholdIds.length === 0) {
      return { receipts: [], total: 0, summary: { total_receipts: 0, total_amount: 0, average_amount: 0, by_category: [] } };
    }

    const queryBuilder = this.receiptsRepository
      .createQueryBuilder('receipt')
      .leftJoinAndSelect('receipt.category', 'category')
      .leftJoinAndSelect('receipt.created_by', 'user')
      .where('receipt.household_id IN (:...householdIds)', { householdIds: accessibleHouseholdIds })
      .orderBy('receipt.receipt_date', 'DESC');

    // Apply filters
    if (filters.startDate && filters.endDate) {
      queryBuilder.andWhere('receipt.receipt_date BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }
    if (filters.categoryIds && filters.categoryIds.length > 0) {
      queryBuilder.andWhere('receipt.category_id IN (:...categoryIds)', {
        categoryIds: filters.categoryIds,
      });
    }
    if (filters.minAmount !== undefined) {
      queryBuilder.andWhere('receipt.amount >= :minAmount', { minAmount: filters.minAmount });
    }
    if (filters.maxAmount !== undefined) {
      queryBuilder.andWhere('receipt.amount <= :maxAmount', { maxAmount: filters.maxAmount });
    }
    if (filters.search) {
      queryBuilder.andWhere(
        '(receipt.title ILIKE :search OR receipt.notes ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }
    // Get total count for pagination
    const total = await queryBuilder.getCount();
    // Apply pagination
    const receipts = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();
    // Generate summary (for first household only)
    const summary = householdIds.length > 0 ? await this.generateSummary(householdIds[0], filters) : null;
    return { receipts, total, summary };
  }

  async findOne(id: string): Promise<Receipt> {
    const receipt = await this.receiptsRepository.findOne({
      where: { id },
      relations: ['household', 'category', 'created_by'],
    });

    if (!receipt) {
      throw new NotFoundException(`Receipt with ID ${id} not found`);
    }

    return receipt;
  }

  async update(id: string, updateReceiptDto: UpdateReceiptDto, userId: string): Promise<Receipt> {
    const receipt = await this.findOne(id);

    // Check if user has permission to update receipts in this household
    await this.householdAccessService.checkCanManageResources(receipt.household_id, userId);

    // If updating category, verify it belongs to the household
    if (updateReceiptDto.category_id) {
      const category = await this.categoriesRepository.findOne({
        where: {
          id: updateReceiptDto.category_id,
          household_id: receipt.household_id,
        },
      });

      if (!category) {
        throw new NotFoundException('Category not found or does not belong to this household');
      }
    }

    Object.assign(receipt, updateReceiptDto);
    return await this.receiptsRepository.save(receipt);
  }

  async remove(id: string, userId: string): Promise<void> {
    const receipt = await this.findOne(id);

    // Check if user has permission to delete receipts in this household
    await this.householdAccessService.checkCanManageResources(receipt.household_id, userId);

    // Delete photo if it exists
    if (receipt.photo_url) {
      await this.deleteReceiptPhoto(receipt);
    }

    await this.receiptsRepository.remove(receipt);
  }

  async getMonthlyReport(householdId: string, month: number, year: number): Promise<ReceiptSummary> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    return await this.generateSummary(householdId, { startDate, endDate });
  }

  async getMonthlyReportForHouseholds(householdIds: string[], month: number, year: number, userId: string): Promise<ReceiptSummary> {
    const allowedIds = await this.householdAccessService.validateAndGetHouseholdIds(householdIds, userId);

    // If user has no allowed households, return empty summary
    if (!allowedIds || allowedIds.length === 0) {
      return { total_receipts: 0, total_amount: 0, average_amount: 0, by_category: [] };
    }

    // Aggregate summaries across allowed households
    let totalReceipts = 0;
    let totalAmount = 0;
    const categoryMap: Map<string, { category: Category; count: number; total: number }> = new Map();

    for (const hid of allowedIds) {
      const summary = await this.generateSummary(hid, { startDate: new Date(year, month - 1, 1), endDate: new Date(year, month, 0) });
      totalReceipts += summary.total_receipts;
      totalAmount += summary.total_amount;
      for (const item of summary.by_category) {
        const key = item.category.id;
        const existing = categoryMap.get(key);
        if (existing) {
          existing.count += item.count;
          existing.total += item.total;
        } else {
          categoryMap.set(key, { category: item.category, count: item.count, total: item.total });
        }
      }
    }

    const by_category = Array.from(categoryMap.values()).sort((a, b) => b.total - a.total);
    const averageAmount = totalReceipts > 0 ? totalAmount / totalReceipts : 0;

    return {
      total_receipts: totalReceipts,
      total_amount: totalAmount,
      average_amount: averageAmount,
      by_category,
    };
  }

  async getReceiptsByCategoryMultiple(householdIds: string[], categoryId: string, limit = 20, userId: string): Promise<Receipt[]> {
    const allowedIds = await this.householdAccessService.validateAndGetHouseholdIds(householdIds, userId);
    if (!allowedIds || allowedIds.length === 0) return [];

    return await this.receiptsRepository.find({
      where: {
        household_id: In(allowedIds),
        category_id: categoryId,
      },
      relations: ['category', 'created_by'],
      order: { receipt_date: 'DESC' },
      take: limit,
    });
  }

  async getExpensesByDateRangeMultiple(householdIds: string[], startDate: Date, endDate: Date, userId: string): Promise<Array<{ date: string; total: number; count: number }>> {
    const allowedIds = await this.householdAccessService.validateAndGetHouseholdIds(householdIds, userId);
    if (!allowedIds || allowedIds.length === 0) return [];

    const result = await this.receiptsRepository
      .createQueryBuilder('receipt')
      .select('DATE(receipt.receipt_date) as date')
      .addSelect('SUM(receipt.amount)', 'total')
      .addSelect('COUNT(*)', 'count')
      .where('receipt.household_id IN (:...allowedIds)', { allowedIds })
      .andWhere('receipt.receipt_date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('DATE(receipt.receipt_date)')
      .orderBy('date', 'ASC')
      .getRawMany();

    return result.map(row => ({
      date: row.date,
      total: parseFloat(row.total),
      count: parseInt(row.count),
    }));
  }

  async uploadPhoto(id: string, file: Express.Multer.File, userId: string): Promise<Receipt> {
    const receipt = await this.findOne(id);

    // Check if user has permission to update receipts in this household
    await this.householdAccessService.checkCanManageResources(receipt.household_id, userId);

    // Delete existing photo if it exists
    if (receipt.photo_url) {
      await this.deleteReceiptPhoto(receipt);
    }

    // Create bucket if it doesn't exist
    await this.supabaseService.createBucket('receipt-photos');

    // Generate unique file path
    const fileExtension = file.originalname.split('.').pop() || 'jpg';
    const fileName = `${receipt.household_id}/${receipt.id}/${Date.now()}.${fileExtension}`;

    // Upload file to Supabase Storage
    const { publicUrl } = await this.supabaseService.uploadFile(
      'receipt-photos',
      fileName,
      file.buffer,
      file.mimetype
    );

    // Update receipt with photo URL
    receipt.photo_url = publicUrl;
    return await this.receiptsRepository.save(receipt);
  }

  async deletePhoto(id: string, userId: string): Promise<Receipt> {
    const receipt = await this.findOne(id);

    // Check if user has permission to update receipts in this household
    await this.householdAccessService.checkCanManageResources(receipt.household_id, userId);

    if (!receipt.photo_url) {
      throw new NotFoundException('Receipt does not have a photo');
    }

    // Delete photo from storage
    await this.deleteReceiptPhoto(receipt);

    // Update receipt to remove photo URL
    receipt.photo_url = null;
    return await this.receiptsRepository.save(receipt);
  }

  private async deleteReceiptPhoto(receipt: Receipt): Promise<void> {
    if (!receipt.photo_url) return;

    try {
      // Extract file path from public URL
      // Supabase public URLs format: https://project.supabase.co/storage/v1/object/public/bucket/path
      const urlParts = receipt.photo_url.split('/');
      const bucketIndex = urlParts.findIndex(part => part === 'receipt-photos');

      if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
        const filePath = urlParts.slice(bucketIndex + 1).join('/');
        await this.supabaseService.deleteFile('receipt-photos', filePath);
      }
    } catch (error) {
      console.error('Failed to delete photo from storage:', error);
      // Don't throw error here as we still want to update the database
    }
  }

  private async generateSummary(householdId: string, filters: ReceiptFilters = {}): Promise<ReceiptSummary> {
    const queryBuilder = this.receiptsRepository
      .createQueryBuilder('receipt')
      .leftJoin('receipt.category', 'category')
      .where('receipt.household_id = :householdId', { householdId });

    // Apply same filters as in findByHousehold
    if (filters.startDate && filters.endDate) {
      queryBuilder.andWhere('receipt.receipt_date BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    if (filters.categoryIds && filters.categoryIds.length > 0) {
      queryBuilder.andWhere('receipt.category_id IN (:...categoryIds)', {
        categoryIds: filters.categoryIds,
      });
    }

    if (filters.minAmount !== undefined) {
      queryBuilder.andWhere('receipt.amount >= :minAmount', { minAmount: filters.minAmount });
    }

    if (filters.maxAmount !== undefined) {
      queryBuilder.andWhere('receipt.amount <= :maxAmount', { maxAmount: filters.maxAmount });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(receipt.title ILIKE :search OR receipt.notes ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    // Get totals
    const totalsResult = await queryBuilder
      .select('COUNT(*)', 'total_receipts')
      .addSelect('SUM(receipt.amount)', 'total_amount')
      .addSelect('AVG(receipt.amount)', 'average_amount')
      .getRawOne();

    // Get category breakdown
    const categoryBreakdown = await queryBuilder
      .select('category.id', 'category_id')
      .addSelect('category.name', 'category_name')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(receipt.amount)', 'total')
      .groupBy('category.id, category.name')
      .orderBy('total', 'DESC')
      .getRawMany();

    // Convert category breakdown to include full category objects
    const by_category = await Promise.all(
      categoryBreakdown.map(async (item) => {
        const category = await this.categoriesRepository.findOne({
          where: { id: item.category_id },
        });
        return {
          category: category!,
          count: parseInt(item.count),
          total: parseFloat(item.total),
        };
      })
    );

    return {
      total_receipts: parseInt(totalsResult.total_receipts) || 0,
      total_amount: parseFloat(totalsResult.total_amount) || 0,
      average_amount: parseFloat(totalsResult.average_amount) || 0,
      by_category,
    };
  }
}
