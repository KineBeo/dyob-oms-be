import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('orders')
@ApiTags('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create an order' }) 
  create(@Body() createOrderDto: CreateOrderDto) {
    const { user_id } = createOrderDto;
    return this.ordersService.create(user_id, createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders' })
  findAll() {
    return this.ordersService.findAll();
  }

  @Get('/id/getOrder/:id')
  @ApiOperation({ summary: 'Find an order by id' })
  findOne(@Param('id') id: number) {
    return this.ordersService.findOne(+id);
  }

  @Get('/user/getAll/:user_id')
  @ApiOperation({ summary: 'Find all orders by user id' })
  findAllByUserId(@Param('user_id') user_id: number) {
    return this.ordersService.findAllByUserId(+user_id);
  }

  @Patch('/id/updateOrder/:id')
  @ApiOperation({ summary: 'Update an order by id' })
  update(@Param('id') id: number, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(+id, updateOrderDto);
  }

  @Delete('/id/:id')
  @ApiOperation({ summary: 'Delete an order by id' })
  remove(@Param('id') id: number) {
    return this.ordersService.remove(+id);
  }
}
