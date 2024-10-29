import { forwardRef, Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import Order from './entities/order.entity';
import { AffiliateProfileModule } from '../affiliate-profile/affiliate-profile.module';
import { CartModule } from '../cart/cart.module';
import { UsersModule } from '../users/users.module';
import { OrderProductModule } from '../order_product/order_product.module';
import { GoogleSheetModule } from 'src/google-sheet/google-sheet.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order]),
    forwardRef(() => AffiliateProfileModule),
    CartModule,
    UsersModule,
    forwardRef(() => OrderProductModule), // Use forwardRef here
    GoogleSheetModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
