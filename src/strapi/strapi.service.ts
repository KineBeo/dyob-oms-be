import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateStrapiDto } from './dto/create-strapi.dto';
import { UpdateStrapiDto } from './dto/update-strapi.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Product from '../products/entities/product.entity';
import ProductCategory from '../product-category/entities/product-category.entity';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class StrapiService {
  private readonly strapiUrl: string;
  private readonly strapiToken: string;
  
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductCategory)
    private categoryRepository: Repository<ProductCategory>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {
    this.strapiUrl = this.configService.get<string>('STRAPI_API_URL');
    this.strapiToken = this.configService.get<string>('STRAPI_API_TOKEN');
  }

  private async fetchFromStrapi<T>(endpoint: string): Promise<T> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.strapiUrl}/${endpoint}`, {
          headers: {
            Authorization: `Bearer ${this.strapiToken}`,
          },
        })
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error('Strapi API Error:', {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url
        });
      }
      throw error;
    }
  }

  async syncCategories(): Promise<void> {
    try {
      // Updated query to match Strapi v4 syntax and include all necessary fields
      const response = await this.fetchFromStrapi<{
        data: Array<{
          id: number;
          documentId: string;
          name: string;
        }>;
      }>('categories?fields=name');

      console.log('Strapi Categories Response:', JSON.stringify(response, null, 2));

      if (!response?.data || !Array.isArray(response.data)) {
        throw new Error('Invalid response format from Strapi categories API');
      }

      for (const category of response.data) {
        if (!category?.name) {
          console.warn('Skipping category due to missing name:', category);
          continue;
        }

        const existingCategory = await this.categoryRepository.findOne({
          where: { name: category.name }
        });

        if (!existingCategory) {
          const newCategory = this.categoryRepository.create({
            name: category.name,
          });
          await this.categoryRepository.save(newCategory);
          console.log('Created new category:', newCategory);
        } 
      }
    } catch (error) {
      console.error('Error syncing categories:', error);
      throw new BadRequestException('Error syncing categories', error.message);
    }
  }

  async syncProducts(): Promise<void> {
    try {
      const strapiProducts = await this.fetchFromStrapi<any>(
        'products?fields=id,Name,Price,slug,Product_details, stock&populate[category][fields]=name'
      );
      console.log('Fetched products from Strapi:', JSON.stringify(strapiProducts, null, 2));
  
      for (const product of strapiProducts.data) {
        try {
          const categoryName = product.category?.name;
          console.log('Processing product:', product.Name, 'Category:', categoryName);
          let category = null;
          
          if (categoryName) {
            category = await this.categoryRepository.findOne({
              where: { name: categoryName }
            });
            console.log('Found category:', category);
          }
  
          const existingProduct = await this.productRepository.findOne({
            where: { name: product.Name },
            relations: ['category'] // Add this to load the category relation
          });
  
          const productData = {
            name: product.Name || 'Unknown',
            price: product.Price?.toString() || '0',
            description: product.Product_details?.toString() || 'nothing',
            category: category, // Set the entire category object instead of just the ID
            stock: product.stock || 0,
            attributes: {}, 
            type: 'nothing',
          };
  
          if (!productData.name) {
            console.warn('Skipping product due to missing name:', product);
            continue;
          }
  
          if (!existingProduct) {
            console.log('Creating new product:', productData);
            const newProduct = this.productRepository.create(productData);
            await this.productRepository.save(newProduct);
          } else {
            console.log('Updating existing product:', productData);
            // Update existing product
            Object.assign(existingProduct, productData);
            await this.productRepository.save(existingProduct);
          }
        } catch (error) {
          console.error('Error processing product:', error);
          continue;
        }
      }
    } catch (error) {
      console.error('Error syncing products:', error);
      throw new BadRequestException('Error syncing products', error.message);
    }
  }
  async syncAll(): Promise<void> {
    try {
      await this.syncCategories();
      await this.syncProducts();
    } catch (error) {
      console.error('Error during sync:', error);
      throw error;
    }
  }

  // ... rest of the service methods
  create(createStrapiDto: CreateStrapiDto) {
    return 'This action adds a new strapi';
  }
  
  findAll() {
    return `This action returns all strapi`;
  }
  
  findOne(id: number) {
    return `This action returns a #${id} strapi`;
  }
  
  update(id: number, updateStrapiDto: UpdateStrapiDto) {
    return `This action updates a #${id} strapi`;
  }
  
  remove(id: number) {
    return `This action removes a #${id} strapi`;
  }
}

