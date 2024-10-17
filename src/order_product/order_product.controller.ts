import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { OrderProductService } from './order_product.service';
import { CreateOrderProductDto } from './dto/create-order_product.dto';
import { UpdateOrderProductDto } from './dto/update-order_product.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('order-product')
@ApiTags('order-product')
export class OrderProductController {
  constructor(private readonly orderProductService: OrderProductService) {}

  @Post()
  @ApiOperation({ summary: 'Create an order product' })
  create(@Body() createOrderProductDto: CreateOrderProductDto) {
    return this.orderProductService.create(createOrderProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all order products' })
  findAll() {
    return this.orderProductService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find an order product by id' })
  findOne(@Param('id') id: number) {
    return this.orderProductService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an order product by id' })
  update(@Param('id') id: number, @Body() updateOrderProductDto: UpdateOrderProductDto) {
    return this.orderProductService.update(+id, updateOrderProductDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an order product by id' })
  remove(@Param('id') id: number) {
    return this.orderProductService.remove(+id);
  }
}
