import { forwardRef, Module } from '@nestjs/common';
import { OrderProductService } from './order_product.service';
import { OrderProductController } from './order_product.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import OrderProduct from './entities/order_product.entity';
import { OrdersModule } from '../orders/orders.module';
import { ProductsModule } from '../products/products.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderProduct]),
    forwardRef(() => OrdersModule), // Use forwardRef here
    ProductsModule,
    UsersModule,
  ],
  controllers: [OrderProductController],
  providers: [OrderProductService],
  exports: [OrderProductService],
})
export class OrderProductModule {}
