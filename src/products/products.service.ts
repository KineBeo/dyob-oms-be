
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import ProductCategory from './entities/product_category.entity';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductCategoryDto } from './dto/create-product_category.dto';
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

  async findParentCategory(id: number) {
    const category = await this.productCategoryRepository.findOne({
      where: { id },
      relations: ['parent'],
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category.parent;
  }

  async findChildrenCategory(id: number) {
    const category = await this.productCategoryRepository.findOne({
      where: { id },
      relations: ['children'],
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category.children;
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
