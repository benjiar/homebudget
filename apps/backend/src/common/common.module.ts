import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HouseholdMember } from '../entities';
import { HouseholdAccessService } from './services/household-access.service';

@Module({
    imports: [TypeOrmModule.forFeature([HouseholdMember])],
    providers: [HouseholdAccessService],
    exports: [HouseholdAccessService],
})
export class CommonModule { }
