import { forwardRef, Module } from '@nestjs/common';
import { AffiliateProfileService } from './affiliate-profile.service';
import { AffiliateProfileController } from './affiliate-profile.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import AffiliateProfile from './entities/affiliate-profile.entity';
import { UsersModule } from '../users/users.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AffiliateProfile]),
    UsersModule,
    forwardRef(() => OrdersModule),
  ],
  controllers: [AffiliateProfileController],
  providers: [AffiliateProfileService],
  exports: [AffiliateProfileService],
})
export class AffiliateProfileModule {}
