import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import Product from './entities/product.entity';
import { CreateProductCategoryDto } from './dto/create-product_category.dto';
import ProductCategory from './entities/product_category.entity';

@Controller('products')
@ApiTags('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a product' })
  @ApiResponse({
    status: 201,
    description: 'The product has been successfully created.',
    type: CreateProductDto,
  })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({
    status: 200,
    description: 'Return all products.',
    type: Product,
  })
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find a product by id' })
  @ApiResponse({
    status: 200,
    description: 'Return the product.',
    type: Product,
  })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a product by id' })
  @ApiResponse({
    status: 200,
    description: 'Return the updated product.',
    type: Product,
  })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(+id, updateProductDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product by id' })
  @ApiResponse({
    status: 200,
    description: 'The product has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }

  /*-------------Category----------------*/

  @Post('category')
  @ApiOperation({ summary: 'Create a product category' })
  @ApiResponse({
    status: 201,
    description: 'The product category has been successfully created.',
    type: ProductCategory,
  })
  createCategory(@Body() createProductCategoryDto: CreateProductCategoryDto) {
    return this.productsService.createCategory(createProductCategoryDto);
  }

  @Get('category')
  @ApiOperation({ summary: 'Get all product categories' })
  @ApiResponse({
    status: 200,
    description: 'Return all product categories.',
    type: ProductCategory,
  })
  findAllCategory() {
    return this.productsService.findAllCategory();
  }

  @Get('category/:id')
  @ApiOperation({ summary: 'Find a product category by id' })
  @ApiResponse({
    status: 200,
    description: 'Return the product category.',
    type: ProductCategory,
  })
  findOneCategory(@Param('id') id: number) {
    return `This action returns a #${id} product category`;
  }

  @Get('category/parent/:id')
  @ApiOperation({ summary: 'Find parent category of a product category' })
  @ApiResponse({
    status: 200,
    description: 'Return the parent category.',
    type: ProductCategory,
  })
  findParentCategory(@Param('id') id: number) {
    return this.productsService.findParentCategory(+id);
  }

  @Get('category/sub/:id')
  @ApiOperation({ summary: 'Find sub-categories of a product category' })
  @ApiResponse({
    status: 200,
    description: 'Return all sub-categories.',
    type: ProductCategory,
  })
  findSubCategories(@Param('id') id: number) {
    return this.findSubCategories(+id);
  }

  @Patch('category/:id')
  @ApiOperation({ summary: 'Update a product category by id' })
  updateCategory(
    @Param('id') id: number,
    @Body() updateProductCategoryDto: CreateProductCategoryDto,
  ) {
    return this.productsService.updateCategory(+id, updateProductCategoryDto);
  }

  @Delete('category/:id')
  @ApiOperation({ summary: 'Delete a product category by id' })
  removeCategory(@Param('id') id: number) {
    return this.productsService.removeCategory(+id);
  }
}
