import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { ProductsModule } from 'src/products/products.module';

@Module({
    imports: [ProductsModule],
    providers: [CartService],
    exports: [CartService],
    controllers: [CartController],
})
export class CartModule { }
