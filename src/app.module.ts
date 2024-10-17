import { Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { OrdersModule } from './orders/orders.module';
import { ProductsModule } from './products/products.module';
import { AffiliateModule } from './affiliate/affiliate.module';
import { DatabaseModule } from './database/database.module';
import { RedisService, RedisModule } from '@liaoliaots/nestjs-redis';
import { CartService } from './cart/cart.service';
import { CartModule } from './cart/cart.module';
import { ProductCategoryModule } from './product-category/product-category.module';
import { OrderProductModule } from './order_product/order_product.module';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: '.env',
  }),
  RedisModule.forRootAsync({
    useFactory: (configService: ConfigService) => ({
      config: {
        host: configService.get('REDIS_HOST'),
        port: configService.get('REDIS_PORT'),
        password: configService.get('REDIS_PASSWORD'),

      },
    }),
    inject: [ConfigService],
  }),
    DatabaseModule,
    UsersModule,
    OrdersModule,
    ProductsModule,
    AffiliateModule,
    CartModule,
    ProductCategoryModule,
    OrderProductModule,
  ],
  controllers: [AppController],
  providers: [AppService, CartService],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly redisService: RedisService) { }

  async onModuleInit() {
    try {
      const client = this.redisService.getOrThrow();
      await client.ping();
      console.log('Successfully connected to Redis');
    } catch (error) {
      console.error('Failed to connect to Redis', error);
    }
  }
}
