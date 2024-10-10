import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { OrdersModule } from './orders/orders.module';
import { ProductsModule } from './products/products.module';
import { AffiliateModule } from './affiliate/affiliate.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [ConfigModule.forRoot(), UsersModule, OrdersModule, ProductsModule, AffiliateModule, DatabaseModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
