import { forwardRef, Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import Order from './entities/order.entity';
import { AffiliateModule } from 'src/affiliate/affiliate.module';
import { CartModule } from 'src/cart/cart.module';
import { UsersModule } from 'src/users/users.module';
import OrderProduct from 'src/order_product/entities/order_product.entity';
import { OrderProductModule } from 'src/order_product/order_product.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order]),
    AffiliateModule,
    CartModule,
    UsersModule,
    forwardRef(() => OrderProductModule), // Use forwardRef here
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule { }
