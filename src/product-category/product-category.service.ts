import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import ProductCategory from './entities/product-category.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ProductCategoryService {
  constructor(
    @InjectRepository(ProductCategory)
    private productCategoryRepository: Repository<ProductCategory>,
  ) { }

  async create(createProductCategoryDto: CreateProductCategoryDto): Promise<ProductCategory> {
    try {
      const { name, parent_id, ...rest } = createProductCategoryDto;
      const existingProductCategory = await this.productCategoryRepository.findOne({ where: { name } });
      if (existingProductCategory) {
        throw new ConflictException('Product category already exists with that name');
      }

      let parent: ProductCategory | null = null;
      if (parent_id) {
        parent = await this.productCategoryRepository.findOne({ where: { id: parent_id } });
        if (!parent) {
          throw new NotFoundException('Parent category does not exist');
        }
      }

      const newCategory = this.productCategoryRepository.create({
        ...rest,
        name,
        parent
      });

      return this.productCategoryRepository.save(newCategory);
    } catch (error) {
      if (error instanceof ConflictException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Something went wrong');
    }
  }

  async findAll(): Promise<ProductCategory[]> {
    try {
      return await this.productCategoryRepository.find({
        relations: ['parent', 'children', 'products']
      });
    } catch (error) {
      throw new BadRequestException('Something went wrong');
    }
  }

  async findOne(id: number): Promise<ProductCategory> {
    try {
      const category = await this.productCategoryRepository.findOne({
        where: { id },
        relations: ['parent', 'children', 'products']
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      return category;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Something went wrong');
    }
  }

  async update(id: number, updateProductCategoryDto: UpdateProductCategoryDto): Promise<ProductCategory> {
    try {
      const category = await this.productCategoryRepository.findOne({
        where: { id }
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      const { name, parent_id, ...rest } = updateProductCategoryDto;
      if (name && name !== category.name) {
        const existingProductCategory = await this.productCategoryRepository.findOne({ where: { name } });
        if (existingProductCategory) {
          throw new ConflictException('Product category already exists with that name');
        }
        category.name = name;
      }

      if (parent_id !== undefined) {
        if (parent_id === null) {
          category.parent = null;
        } else {
          const parent = await this.productCategoryRepository.findOne({ where: { id: parent_id } });
          if (!parent) {
            throw new NotFoundException('Parent category does not exist');
          }
          category.parent = parent;
        }
      }

      Object.assign(category, rest);
      return await this.productCategoryRepository.save(category);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Something went wrong');
    }
  }

  async remove(id: number): Promise<{ message: string }> {
    try {
      const category = await this.productCategoryRepository.findOne({
        where: { id },
        relations: ['children', 'products']
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      if (category.children.length > 0 || category.products.length > 0) {
        throw new ConflictException('Cannot delete category with children or products');
      }

      await this.productCategoryRepository.remove(category);
      return { message: `Product category with id ${id} has been successfully deleted` };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Something went wrong');
    }
  }
}
