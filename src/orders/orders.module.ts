import { forwardRef, Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import Order from './entities/order.entity';
import { CartModule } from '../cart/cart.module';
import { UsersModule } from '../users/users.module';
import { OrderProductModule } from '../order_product/order_product.module';
import { UserStatusModule } from 'src/user-status/user-status.module';
import { UserAddressModule } from 'src/user-address/user-address.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order]),
    CartModule,
    UsersModule,
    forwardRef(() => OrderProductModule), // Use forwardRef here
    UserStatusModule,
    UserAddressModule
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
