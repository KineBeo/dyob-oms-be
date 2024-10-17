import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import Product from './entities/product.entity';
import { Repository } from 'typeorm';
import { ProductCategoryService } from 'src/product-category/product-category.service';
import ProductCategory from 'src/product-category/entities/product-category.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductCategory)
    private productCategoryRepository: Repository<ProductCategory>
  ) { }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    try {
      const { name, price, category_id, ...rest } = createProductDto;
      const existingProduct = await this.productRepository.findOne(
        { where: [{ name }, { price }] }
      );
      if (existingProduct) {
        throw new ConflictException('Product already exists with that name or price');
      }

      let category: ProductCategory | null = null;
      if (category_id) {
        category = await this.productCategoryRepository.findOne({
          where: { id: category_id },
          relations: ['parent']
        });
        if (!category) {
          throw new NotFoundException(`Category with id ${category_id} not found`);
        }
      }
      const newProduct = this.productRepository.create({
        ...rest,
        name,
        price, 
        category, 
        attributes: rest.attributes || {}, 
        stock: rest.stock || 0
      });

      const savedProduct = await this.productRepository.save(newProduct);
      return await this.productRepository.findOne({
        where: { id: savedProduct.id },
        relations: ['category']
      });

    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Something went wrong');
    }
  }

  async findAll(): Promise<Product[]> {
    try {
      const products = await this.productRepository.find();
      return products;
    } catch (error) {
      throw new BadRequestException('Something went wrong');
    }
  }

  async findOne(id: number): Promise<Product> {
    try {
      const product = await this.productRepository.findOne({ where: { id } });
      if (!product) {
        throw new NotFoundException('Product not found');
      }
      
      return product;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Something went wrong');
    }
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    try {
      const product = await this.productRepository.findOne({ where: { id } });
      if (!product) {
        throw new NotFoundException('Product not found');
      }
      const { name, price, ...rest } = updateProductDto;
      Object.assign(product, rest);
      return await this.productRepository.save(product);
    } catch (error) {
      throw new BadRequestException('Something went wrong');
    }
  }

  async remove(id: number): Promise<{messsage: string}> {
    try {
      const res = await this.productRepository.delete(id);
      if (res.affected === 0) {
        throw new NotFoundException('Product not found');
      } else {
        return { messsage: `Product with id ${id} has been successfully deleted`};
      }

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Something went wrong');
    }
  }
}
