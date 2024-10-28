import { Body, Controller, Delete, ForbiddenException, Get, Param, Post, Put, Req, Request, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('cart')
@ApiTags('cart')
export class CartController {
  constructor(private readonly cartService: CartService) { }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth') 
  @Post()
  @ApiOperation({ summary: 'Add to cart' })
  addToCart(@Body() createCartDto: CreateCartDto, @Request() req) {
    if (Number(req.user.sub) !== Number(createCartDto.user_id)) {
      throw new ForbiddenException('You can only add to your own cart');
    }
    return this.cartService.addToCart(createCartDto);
  }

  @Get('/id/:id')
  @ApiOperation({ summary: 'Get cart by user id' })
  getCart(@Param('id') id: number) {
    return this.cartService.getCart(id);
  }

  @Get('/all')
  @ApiOperation({ summary: 'Get all carts' })
  getAllCarts() {
    return this.cartService.getAllCarts();
  }

  @Delete('/all/id/:id/product/:productId')
  @ApiOperation({ summary: 'Remove product from cart' })
  removeFromCart(@Param('id') user_id: number, @Param('productId') product_id: number) {
    return this.cartService.removeFromCart(user_id, product_id);
  }

  @Delete('/id/:id')
  @ApiOperation({ summary: 'Clear cart of user with id' })
  clearCart(@Param('id') id: number) {
    return this.cartService.clearCart(id);
  }

  @Put('/id/:id')
  @ApiOperation({ summary: 'Update cart item quantity' })
  updateCartItem(@Body() updateCartDto: UpdateCartDto) {
    return this.cartService.updateCartItemQuantity(updateCartDto.user_id, updateCartDto);
  }
}
