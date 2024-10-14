import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import ProductCategory from './entities/product_category.entity';
import { CreateProductCategoryDto } from './dto/create-product_category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Product from './entities/product.entity';
import { UpdateProductCategoryDto } from './dto/update-product_category.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,

    @InjectRepository(ProductCategory)
    private productCategoryRepository: Repository<ProductCategory>,
  ) {}

  create(createProductDto: CreateProductDto) {
    return 'This action adds a new product';
  }

  findAll() {
    return `This action returns all products`;
  }

  findOne(id: number) {
    return `This action returns a #${id} product`;
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }

  /*-------------Category----------------*/

  async createCategory(
    createProductCategoryDto: CreateProductCategoryDto,
  ): Promise<ProductCategory> {
    const { name, parent_id, ...rest } = createProductCategoryDto;

    const existingCategory = await this.productCategoryRepository.findOne({
      where: { name },
    });
    if (existingCategory) {
      throw new ConflictException('Category already exists with that name');
    }

    if (parent_id != null) {
      const parentCategory = await this.productCategoryRepository.findOne({
        where: { id: parent_id },
      });

      if (!parentCategory) {
        throw new NotFoundException('Parent category not found');
      }
    }

    const newCategory = this.productCategoryRepository.create({
      ...rest,
      name,
      parent_id,
    });

    return this.productCategoryRepository.save(newCategory);
  }

  async findAllCategory(): Promise<ProductCategory[]> {
    return await this.productCategoryRepository.find();
  }

  async findOneCategory(id: number) {
    const category = await this.productCategoryRepository.findOne({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async updateCategory(
    id: number,
    updateProductCategoryDto: UpdateProductCategoryDto,
  ): Promise<ProductCategory> {
    const category = await this.productCategoryRepository.findOne({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    Object.assign(category, updateProductCategoryDto);
    return await this.productCategoryRepository.save(category);
  }

  removeCategory(id: number) {
    const category = this.productCategoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.productCategoryRepository.delete(id);
  }
}
