import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import Product from './entities/product.entity';
import { Repository } from 'typeorm';
import ProductCategory from './entities/product_category.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductCategory)
    private productCategoryRepository: Repository<ProductCategory>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const category = this.productCategoryRepository.findOne({
      where: { id: createProductDto.category_id },
    });
    if (!category) {
      throw new NotFoundException(
        `Category #${createProductDto.category_id} not found`,
      );
    }

    const product = this.productRepository.create(createProductDto);
    return await this.productRepository.save(product);
  }

  async findAll(): Promise<Product[]> {
    return await this.productRepository.find();
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product #${id} not found`);
    }
    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const { category_id, ...rest } = updateProductDto;
    const category = await this.productCategoryRepository.findOne({
      where: { id: category_id },
    });

    if (!category) {
      throw new NotFoundException(`Category #${category_id} not found`);
    }

    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product #${id} not found`);
    }

    Object.assign(product, rest);
    return this.productRepository.save(product);
  }

  remove(id: number) {
    if (!this.productRepository.findOne({ where: { id } })) {
      throw new NotFoundException(`Product #${id} not found`);
    }

    return this.productRepository.delete(id);
  }
}
