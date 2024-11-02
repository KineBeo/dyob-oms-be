import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { ProductsModule } from '../products/products.module';
import { UsersModule } from 'src/users/users.module';

@Module({
    imports: [ProductsModule, UsersModule],
    providers: [CartService],
    exports: [CartService],
    controllers: [CartController],
})
export class CartModule { }
