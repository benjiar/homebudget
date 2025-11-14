import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Logger,
    Request,
} from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto, UpdateBudgetDto, BudgetFilterDto } from './dto/budget.dto';
import { SupabaseAuthGuard } from '../supabase/supabase-auth.guard';
import { HouseholdHeader } from '../common/decorators/household-header.decorator';
import { HouseholdAccessService } from '../common/services/household-access.service';

@Controller('budgets')
@UseGuards(SupabaseAuthGuard)
export class BudgetsController {
    private readonly logger = new Logger(BudgetsController.name);

    constructor(
        private readonly budgetsService: BudgetsService,
        private readonly householdAccessService: HouseholdAccessService,
    ) { }

    @Post()
    create(@HouseholdHeader() householdIds: string[], @Body() createBudgetDto: CreateBudgetDto) {
        this.logger.log(`[CREATE] Budget creation request received`);
        this.logger.debug(`[CREATE] Household IDs: ${JSON.stringify(householdIds)}`);
        this.logger.debug(`[CREATE] Budget data: ${JSON.stringify(createBudgetDto)}`);

        // Use the first household ID from the header
        const householdId = householdIds[0];

        if (!householdId) {
            this.logger.error('[CREATE] No household ID provided in header');
            throw new Error('Household ID is required');
        }

        this.logger.log(`[CREATE] Creating budget for household: ${householdId}`);
        return this.budgetsService.create(householdId, createBudgetDto);
    }

    @Get()
    async findAll(
        @HouseholdHeader() householdIds: string[],
        @Query() filters: BudgetFilterDto,
        @Request() req: any,
    ) {
        this.logger.log(`[FIND_ALL] Fetching budgets`);
        this.logger.debug(`[FIND_ALL] Household IDs: ${JSON.stringify(householdIds)}`);
        this.logger.debug(`[FIND_ALL] Filters: ${JSON.stringify(filters)}`);

        // If no household IDs provided, get all user households
        let finalHouseholdIds = householdIds;
        if (!householdIds || householdIds.length === 0) {
            finalHouseholdIds = await this.householdAccessService.getUserAccessibleHouseholds(req.user.id);
            this.logger.debug(`[FIND_ALL] No household IDs provided, using all user households: ${JSON.stringify(finalHouseholdIds)}`);
        }

        return this.budgetsService.findAll(finalHouseholdIds, filters);
    }

    @Get('overview')
    async getBudgetOverview(
        @HouseholdHeader() householdIds: string[],
        @Query() filters: BudgetFilterDto,
        @Request() req: any,
    ) {
        this.logger.log(`[OVERVIEW] Fetching budget overview`);
        this.logger.debug(`[OVERVIEW] Household IDs: ${JSON.stringify(householdIds)}`);

        // If no household IDs provided, get all user households
        let finalHouseholdIds = householdIds;
        if (!householdIds || householdIds.length === 0) {
            finalHouseholdIds = await this.householdAccessService.getUserAccessibleHouseholds(req.user.id);
            this.logger.debug(`[OVERVIEW] No household IDs provided, using all user households: ${JSON.stringify(finalHouseholdIds)}`);
        }

        return this.budgetsService.getBudgetOverview(finalHouseholdIds, filters);
    }

    @Get('suggestions')
    getSuggestions(@HouseholdHeader() householdIds: string[]) {
        this.logger.log(`[SUGGESTIONS] Fetching budget suggestions`);
        this.logger.debug(`[SUGGESTIONS] Household IDs: ${JSON.stringify(householdIds)}`);

        // Use the first household ID from the header
        const householdId = householdIds[0];
        return this.budgetsService.suggestBudgets(householdId);
    }

    @Get(':id')
    findOne(@HouseholdHeader() householdIds: string[], @Param('id') id: string) {
        this.logger.log(`[FIND_ONE] Fetching budget: ${id}`);
        this.logger.debug(`[FIND_ONE] Household IDs: ${JSON.stringify(householdIds)}`);

        // Use the first household ID from the header
        const householdId = householdIds[0];
        return this.budgetsService.findOne(id, householdId);
    }

    @Put(':id')
    update(
        @HouseholdHeader() householdIds: string[],
        @Param('id') id: string,
        @Body() updateBudgetDto: UpdateBudgetDto,
    ) {
        this.logger.log(`[UPDATE] Updating budget: ${id}`);
        this.logger.debug(`[UPDATE] Household IDs: ${JSON.stringify(householdIds)}`);
        this.logger.debug(`[UPDATE] Update data: ${JSON.stringify(updateBudgetDto)}`);

        // Use the first household ID from the header
        const householdId = householdIds[0];
        return this.budgetsService.update(id, householdId, updateBudgetDto);
    }

    @Delete(':id')
    remove(@HouseholdHeader() householdIds: string[], @Param('id') id: string) {
        this.logger.log(`[DELETE] Deleting budget: ${id}`);
        this.logger.debug(`[DELETE] Household IDs: ${JSON.stringify(householdIds)}`);

        // Use the first household ID from the header
        const householdId = householdIds[0];
        return this.budgetsService.remove(id, householdId);
    }
}
