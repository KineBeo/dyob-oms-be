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
        throw new ConflictException('Product already exists with that name or price from create product service');
      }

      let category: ProductCategory | null = null;
      if (category_id) {
        category = await this.productCategoryRepository.findOne({
          where: { id: category_id },
          relations: ['parent']
        });
        if (!category) {
          throw new NotFoundException(`Category with id ${category_id} not found from create product service`);
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
      throw new BadRequestException('Something went wrong from create product service');
    }
  }

  async findAll(): Promise<Product[]> {
    try {
      const products = await this.productRepository.find();
      return products;
    } catch (error) {
      throw new BadRequestException('Something went wrong from find all products service');
    }
  }

  async findOne(id: number): Promise<Product> {
    try {
      const product = await this.productRepository.findOne({ where: { id } });
      if (!product) {
        throw new NotFoundException('Product not found from find one product service');
      }
      
      return product;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Something went wrong from find one product service');
    }
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    try {
      const product = await this.productRepository.findOne({ where: { id } });
      if (!product) {
        throw new NotFoundException('Product not found from update product service');
      }
      const { name, price, ...rest } = updateProductDto;
      Object.assign(product, rest);
      return await this.productRepository.save(product);
    } catch (error) {
      throw new BadRequestException('Something went wrong from update product service');
    }
  }

  async remove(id: number): Promise<{messsage: string}> {
    try {
      const res = await this.productRepository.delete(id);
      if (res.affected === 0) {
        throw new NotFoundException('Product not found from delete product service');
      } else {
        return { messsage: `Product with id ${id} has been successfully deleted from delete product service` };
      }

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Something went wrong from delete product service');
    }
  }

  async getProductPrice(product_id: number): Promise<string> {
    try {
      const product = await this.productRepository.findOne({ where: { id: product_id } });
      if (!product) {
        throw new NotFoundException('Product not found from get product price service');
      }

      return product.price;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Something went wrong from get product price service');
    }
  }
}
