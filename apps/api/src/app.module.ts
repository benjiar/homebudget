import { Module } from '@nestjs/common';
import { DatabaseService } from './database/database.service';
import { UsersModule } from './users/users.module';
import { ReceiptsModule } from './receipts/receipts.module';

@Module({
  imports: [UsersModule, ReceiptsModule],
  controllers: [],
  providers: [DatabaseService],
})
export class AppModule {}