import { forwardRef, Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import Order from './entities/order.entity';
import { AffiliateModule } from '../affiliate/affiliate.module';
import { CartModule } from '../cart/cart.module';
import { UsersModule } from '../users/users.module';
import { OrderProductModule } from '../order_product/order_product.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order]),
    forwardRef(() => AffiliateModule),
    CartModule,
    UsersModule,
    forwardRef(() => OrderProductModule), // Use forwardRef here
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule { }
