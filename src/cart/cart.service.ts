import { RedisService } from '@liaoliaots/nestjs-redis';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Redis } from 'ioredis';
import { CreateCartDto } from './dto/create-cart.dto';
import Cart from './entities/cart-item.entity';
import { UpdateCartDto } from './dto/update-cart.dto';

@Injectable()
export class CartService {
    private readonly redis: Redis;
    constructor(private readonly redisService: RedisService) {
        this.redis = this.redisService.getOrThrow();
    }

    private getCartKey(userId: number): string {
        return `cart:${userId}`;
    }

    async addToCart(cart: CreateCartDto): Promise<CreateCartDto> {
        const { user_id, ...rest } = cart;
        const cartKey = this.getCartKey(user_id);

        try {
            await this.redis.hset(cartKey, rest.product_id.toString(), JSON.stringify(rest));
            return cart;
        } catch (error) {
            throw new BadRequestException('Failed to add item to cart from addToCart');
        }
    }

    async getCart(userId: number): Promise<Cart[]> {
        try {
            const cartKey = this.getCartKey(userId);
            const cartItems = await this.redis.hgetall(cartKey);
            if (!cartItems || Object.keys(cartItems).length === 0) {
                throw new NotFoundException('Cannot find cart items');
            }
            return Object.values(cartItems).map((item) => JSON.parse(item));
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Something went wrong from getCart');
        }
    }

    async getAllCarts(): Promise<{ userId: number, cartItems: Cart[] }[]> {
        const cartKeys = await this.redis.keys('cart:*');
        if (!cartKeys || cartKeys.length === 0) {
            throw new NotFoundException('Cannot find any cart items');
        }

        const allCarts: { userId: number, cartItems: Cart[] }[] = [];
        for (const cartKey of cartKeys) {
            const userId = parseInt(cartKey.split(':')[1], 10);
            const items = await this.redis.hgetall(cartKey);
            if (items) {
                const cartItems = Object.values(items).map((item) => JSON.parse(item));
                allCarts.push({ userId, cartItems });
            }
        }
        return allCarts;
    }

    async clearCart(userId: number): Promise<{ message: string }> {
        try {
            const cartKey = this.getCartKey(userId);
            const cartItems = await this.redis.hgetall(cartKey);
            if (!cartItems || Object.keys(cartItems).length === 0) {
                throw new NotFoundException('Cannot find cart items');
            }
            await this.redis.del(cartKey);
            return { message: 'Cart cleared successfully' };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Something went wrong from clearCart');
        }
    }

    async removeFromCart(userId: number, productId: number): Promise<{ message: string }> {
        try {
            const cartKey = this.getCartKey(userId);
            const cartItems = await this.redis.hgetall(cartKey);

            if (!cartItems || Object.keys(cartItems).length === 0) {
                throw new NotFoundException('Cannot find cart items');
            }

            const productIdString = productId.toString();
            if (!(productIdString in cartItems)) {
                throw new NotFoundException(`Product with id ${productId} not found in cart`);
            }

            await this.redis.hdel(cartKey, productIdString);

            return { message: 'Item removed from cart successfully' };
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Something went wrong from removeFromCart');
        }
    }

    async updateCartItemQuantity(userId: number, updateCartDto: UpdateCartDto): Promise<{message: string}> {
        try {
            const { product_id, quantity } = updateCartDto;
            const cartKey = this.getCartKey(userId);
            const item = await this.redis.hget(cartKey, product_id.toString());
            if (item) {
                const parsedItem: Cart = JSON.parse(item);
                parsedItem.quantity = quantity;
                await this.redis.hset(cartKey, product_id.toString(), JSON.stringify(parsedItem));
            } else {
                throw new NotFoundException('Item of user not found in cart from updateCartItemQuantity');
            }

            return { message: 'Cart item quantity updated successfully' };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Something went wrong from updateCartItemQuantity');
        }
    }
}
