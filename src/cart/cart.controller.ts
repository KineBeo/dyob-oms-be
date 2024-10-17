import { Body, Controller, Delete, Get, Param, Post, Put, Req } from '@nestjs/common';
import { CartService } from './cart.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';

@Controller('cart')
@ApiTags('cart')
export class CartController {
  constructor(private readonly cartService: CartService) { }

  @Post()
  @ApiOperation({ summary: 'Add to cart' })
  addToCart(@Body() createCartDto: CreateCartDto) {
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
