import { Module } from '@nestjs/common';
import { StrapiService } from './strapi.service';
import { StrapiController } from './strapi.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import Product from 'src/products/entities/product.entity';
import ProductCategory from 'src/product-category/entities/product-category.entity';
import { HttpModule } from '@nestjs/axios';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductCategory]), HttpModule, UsersModule],
  controllers: [StrapiController],
  providers: [StrapiService],
})
export class StrapiModule {}
