import { Body, Controller, Delete, ForbiddenException, Get, Param, Post, Put, Req, Request, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import { Role } from '../enum/role';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('cart')
@ApiTags('cart')
export class CartController {
  constructor(private readonly cartService: CartService) { }

  
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth') 
  @ApiOperation({ summary: 'Add to cart' })
  addToCart(@Body() createCartDto: CreateCartDto, @Request() req) {
    if (Number(req.user.sub) !== Number(createCartDto.user_id)) {
      throw new ForbiddenException('You can only add to your own cart');
    }
    return this.cartService.addToCart(createCartDto);
  }

  @Get('/id/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth') 
  @ApiOperation({ summary: 'Get cart by user id' })
  getCart(@Param('id') id: number, @Request() req) {
    if (Number(req.user.sub) !== Number(id)) {
      throw new ForbiddenException('You can only access your own cart');
    }
    return this.cartService.getCart(id);
  }

  @Get('/all')
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all carts' })
  getAllCarts() {
    return this.cartService.getAllCarts();
  }

  @Delete('/all/id/:id/product/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Remove product from cart of user with id' })
  removeFromCart(@Param('id') user_id: number, @Param('productId') product_id: number, @Request() req) {
    if (Number(req.user.sub) !== Number(user_id)) {
      throw new ForbiddenException('You can only remove from your own cart');
    }
    return this.cartService.removeFromCart(user_id, product_id);
  }

  @Delete('/id/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth') 
  @ApiOperation({ summary: 'Clear cart of user with id' })
  clearCart(@Param('id') id: number, @Request() req) {
    if (Number(req.user.sub) !== Number(id)) {
      throw new ForbiddenException('You can only clear your own cart');
    }
    return this.cartService.clearCart(id);
  }

  @Put('/id/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update cart item quantity of user with id' })
  updateCartItem(@Body() updateCartDto: UpdateCartDto, @Request() req) {
    if (Number(req.user.sub) !== Number(updateCartDto.user_id)) {
      throw new ForbiddenException('You can only update your own cart');
    }
    return this.cartService.updateCartItemQuantity(updateCartDto.user_id, updateCartDto);
  }
}
