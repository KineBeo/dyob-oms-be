import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import { Role } from '../enum/role';
import { OrderStatus } from 'src/enum/order-status';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Controller('orders')
@ApiTags('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * * User
   * @param createOrderDto
   * @returns
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create an order' })
  create(@Body() createOrderDto: CreateOrderDto, @Request() req) {
    const { user_id } = createOrderDto;
    if (Number(req.user.sub) !== Number(user_id)) {
      throw new ForbiddenException('You can only access your own information');
    }
    return this.ordersService.create(createOrderDto);
  }

  @Patch('/id/updateOrderAdmin/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'ADMIN: Update an order status by id' })
  async updateStatusAdmin(
    @Param('id') id: number,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(+id, dto.status);
  }

  /**
   * ! Admin
   * @returns
   */
  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'ADMIN: Get all orders' })
  findAll() {
    return this.ordersService.findAll();
  }

  /**
   * ! Admin
   * @param id
   * @returns
   */
  @Get('/id/getOrder/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'ADMIN: Find an order by id' })
  findOne(@Param('id') id: number) {
    return this.ordersService.findOne(+id);
  }

  @Get('/user/getAll/:user_id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Find all orders by user id' })
  findAllByUserId(@Param('user_id') user_id: number, @Request() req) {
    if (Number(req.user.sub) !== Number(user_id)) {
      throw new ForbiddenException('You can only access your own information');
    }
    return this.ordersService.findAllByUserId(+user_id);
  }

  @Patch('/id/updateOrder/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update an order by id' })
  update(@Param('id') id: number, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(+id, updateOrderDto);
  }

  @Delete('/id/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'ADMIN: Delete an order by id' })
  remove(@Param('id') id: number) {
    return this.ordersService.remove(+id);
  }
}
