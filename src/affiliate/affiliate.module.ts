import { forwardRef, Module } from '@nestjs/common';
import { AffiliateService } from './affiliate.service';
import { AffiliateController } from './affiliate.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import AffiliateProfile from './entities/affiliate.entity';
import { UsersModule } from '../users/users.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AffiliateProfile]),
    UsersModule,
    forwardRef(() => OrdersModule),
  ],
  controllers: [AffiliateController],
  providers: [AffiliateService],
  exports: [AffiliateService],
})
export class AffiliateModule {}
