import { Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { OrdersModule } from './orders/orders.module';
import { ProductsModule } from './products/products.module';
import { DatabaseModule } from './database/database.module';
import { RedisService, RedisModule } from '@liaoliaots/nestjs-redis';
import { CartService } from './cart/cart.service';
import { CartModule } from './cart/cart.module';
import { ProductCategoryModule } from './product-category/product-category.module';
import { OrderProductModule } from './order_product/order_product.module';
import { UserStatusModule } from './user-status/user-status.module';
import { AuthModule } from './auth/auth.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { StrapiModule } from './strapi/strapi.module';
import { UserAddressModule } from './user-address/user-address.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CommissionHistoryModule } from './commission-history/commission-history.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
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
    EventEmitterModule.forRoot(),
    DatabaseModule,
    UsersModule,
    OrdersModule,
    ProductsModule,
    CartModule,
    ProductCategoryModule,
    OrderProductModule,
    UserStatusModule,
    StrapiModule,
    AuthModule,
    UserAddressModule,
    CommissionHistoryModule,
  ],
  controllers: [AppController],
  providers: [AppService, CartService, {
    provide: APP_GUARD,
    useClass: JwtAuthGuard,
  }],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly redisService: RedisService) {}

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
