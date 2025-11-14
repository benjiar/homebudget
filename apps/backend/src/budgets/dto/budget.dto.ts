import { IsString, IsNumber, IsEnum, IsDateString, IsOptional, IsBoolean, IsUUID, Min, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { BudgetPeriod } from '../../entities/budget.entity';

// Transform empty strings to undefined
const EmptyStringToUndefined = () =>
    Transform(({ value }) => {
        if (value === '' || value === null) {
            return undefined;
        }
        return value;
    });

export class CreateBudgetDto {
    @IsString()
    @MaxLength(255)
    name: string;

    @IsOptional()
    @IsString()
    @EmptyStringToUndefined()
    description?: string;

    @IsNumber()
    @Min(0)
    amount: number;

    @IsEnum(BudgetPeriod)
    period: BudgetPeriod;

    @IsDateString()
    start_date: string;

    @IsDateString()
    end_date: string;

    @IsOptional()
    @IsUUID()
    @EmptyStringToUndefined()
    category_id?: string;

    @IsOptional()
    @IsBoolean()
    is_recurring?: boolean;

    @IsOptional()
    @IsBoolean()
    deactivate_overlapping?: boolean;

    @IsOptional()
    metadata?: Record<string, any>;
}

export class UpdateBudgetDto {
    @IsOptional()
    @IsString()
    @MaxLength(255)
    name?: string;

    @IsOptional()
    @IsString()
    @EmptyStringToUndefined()
    description?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    amount?: number;

    @IsOptional()
    @IsEnum(BudgetPeriod)
    period?: BudgetPeriod;

    @IsOptional()
    @IsDateString()
    start_date?: string;

    @IsOptional()
    @IsDateString()
    end_date?: string;

    @IsOptional()
    @IsUUID()
    @EmptyStringToUndefined()
    category_id?: string;

    @IsOptional()
    @IsBoolean()
    is_active?: boolean;

    @IsOptional()
    @IsBoolean()
    is_recurring?: boolean;

    @IsOptional()
    metadata?: Record<string, any>;
}

export class BudgetFilterDto {
    @IsOptional()
    @IsEnum(BudgetPeriod)
    period?: BudgetPeriod;

    @IsOptional()
    @IsUUID()
    category_id?: string;

    @IsOptional()
    @IsDateString()
    start_date?: string;

    @IsOptional()
    @IsDateString()
    end_date?: string;

    @IsOptional()
    @IsBoolean()
    is_active?: boolean;

    @IsOptional()
    @IsBoolean()
    include_inactive?: boolean;
}
