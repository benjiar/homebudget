import { IsString, IsNumber, IsDateString, IsOptional, IsUUID, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class UpdateReceiptDto {
    @IsOptional()
    @IsString()
    @Transform(({ value }) => typeof value === 'string' ? value : String(value))
    title?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Transform(({ value }) => typeof value === 'number' ? value : parseFloat(value))
    @Type(() => Number)
    amount?: number;

    @IsOptional()
    @IsDateString()
    @Transform(({ value }) => {
        // Handle both Date objects and string dates from FormData
        if (value instanceof Date) {
            return value.toISOString().split('T')[0];
        }
        return typeof value === 'string' ? value : String(value);
    })
    receipt_date?: string;

    @IsOptional()
    @IsString()
    @Transform(({ value }) => value === undefined || value === null || value === 'undefined' ? undefined : String(value))
    notes?: string;

    @IsOptional()
    @IsString()
    photo_url?: string;

    @IsOptional()
    metadata?: Record<string, any>;

    @IsOptional()
    @IsUUID()
    @Transform(({ value }) => typeof value === 'string' ? value : String(value))
    category_id?: string;
}
