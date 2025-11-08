import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extracts and parses X-Household-Ids header as a JSON array of strings.
 * If header is missing or invalid, returns an empty array.
 * Usage: async myHandler(@HouseholdHeader() householdIds: string[]) { ... }
 */
export const HouseholdHeader = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string[] => {
    const request = ctx.switchToHttp().getRequest();
    const header = request.headers['x-household-ids'];
    if (!header) return [];
    try {
      const raw = (header as string).trim();
      if (!raw) return [];
      return raw.split(',').map((s) => s.trim()).filter(Boolean);
    } catch (e) {
      return [];
    }
  },
);

