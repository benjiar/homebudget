import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';

/**
 * Custom decorator to transform and validate FormData body
 * This is needed because @Body() with ValidationPipe doesn't work well with multipart/form-data
 */
export const ValidatedFormData = createParamDecorator(
    async (dtoClass: any, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const body = request.body;

        if (!body || Object.keys(body).length === 0) {
            throw new BadRequestException('Request body is empty');
        }

        // Transform plain object to DTO instance
        const dtoInstance = plainToClass(dtoClass, body);

        // Validate the DTO
        const errors: ValidationError[] = await validate(dtoInstance, {
            whitelist: true,
            forbidNonWhitelisted: false,
        });

        if (errors.length > 0) {
            const errorMessages = errors.map((error) => {
                return Object.values(error.constraints || {}).join(', ');
            });
            throw new BadRequestException({
                message: 'Validation failed',
                errors: errorMessages,
            });
        }

        return dtoInstance;
    },
);
