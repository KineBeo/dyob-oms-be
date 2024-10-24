import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { InjectRepository } from '@nestjs/typeorm';
import Order from './entities/order.entity';
import { Repository } from 'typeorm';
import { CartService } from '../cart/cart.service';
import { AffiliateService } from '../affiliate/affiliate.service'
import { OrderStatus } from '../enum/order-status';
import { UsersService } from '../users/users.service';
import { OrderProductService } from '../order_product/order_product.service';
import { CreateOrderFullAttributesDto } from './dto/create-order-full-attributes.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private cartService: CartService,
    private affiliateService: AffiliateService,
    private userService: UsersService,
    @Inject(forwardRef(() => OrderProductService))
    private orderProductService: OrderProductService,
  ) {}

  async create(userId: number, createOrderDto: CreateOrderDto): Promise<Order> {
    const { affiliate_id } = createOrderDto;

    try {
      // Check if user exists
      const user = await this.userService.findOne(userId);
      if (!user) {
        throw new NotFoundException(
          `User with ID ${userId} not found from create order service`,
        );
      }

      const cartItems = await this.cartService.getCart(userId);
      if (!cartItems || cartItems.length === 0) {
        throw new Error('Cart is empty from create order service');
      }

      const total_amount = cartItems
        .reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)
        .toString();

      const affiliate =
        await this.affiliateService.findAffiliateByUserId(userId);

      const order = this.orderRepository.create({
        user: { id: userId },
        affiliate: affiliate ? { id: affiliate.id } : null,
        total_amount,
        address: createOrderDto.address,
        status: OrderStatus.NOT_START_YET,
      });
      const savedOrder = await this.orderRepository.save(order);

      if (affiliate_id) {
        // Check if affiliate exists
        const affiliate = await this.affiliateService.findOne(affiliate_id);
        if (!affiliate) {
          throw new NotFoundException(
            `Affiliate with ID ${affiliate_id} not found from create order service`,
          );
        }

        affiliate.direct_sales = (
          parseFloat(affiliate.direct_sales) + parseFloat(total_amount)
        ).toString();

        // TODO: Calculate commission
        const commission =
          await this.affiliateService.calculateDirectCommission(savedOrder.id);
        affiliate.commission = (
          parseFloat(affiliate.commission) + commission
        ).toString();

         // Update parent chain group sales
         await this.updateParentChainGroupSales(affiliate_id, parseFloat(total_amount));

         // Check for rank updates
         await this.affiliateService.checkAndUpdateRank(affiliate_id);
      }
      const orderItems = cartItems.map((item) => ({
        order_id: savedOrder.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
      }));
      await this.orderProductService.createMany(orderItems);
      // Clear the cart after successful order creation
      await this.cartService.clearCart(userId);
      return this.findOne(savedOrder.id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create order: ${error.message} from create order service`,
      );
    }
  }

   /**
   * Updates group sales for entire parent chain
   * Ensures accurate tracking of group performance metrics
   */
   private async updateParentChainGroupSales(
    affiliateId: number,
    amount: number
  ): Promise<void> {
    try {
      let currentAffiliate = await this.affiliateService.findOne(affiliateId);
      
      while (currentAffiliate.parent) {
        currentAffiliate = await this.affiliateService.findOne(currentAffiliate.parent.id);
        currentAffiliate.group_sales = (
          parseFloat(currentAffiliate.group_sales) + 
          amount
        ).toString();
        await this.affiliateService.update(
          currentAffiliate.id,
          { group_sales: currentAffiliate.group_sales }
        );
      }
    } catch (error) {
      throw new BadRequestException('Failed to update parent chain group sales');
    }
  }


  async findAll(): Promise<Order[]> {
    try {
      const orders = await this.orderRepository.find();
      return orders;
    } catch (error) {
      throw new BadRequestException(
        'Something went wrong from find all orders service',
      );
    }
  }

  async findOne(id: number): Promise<Order> {
    try {
      const order = await this.orderRepository.findOne({ where: { id } });
      if (!order) {
        throw new NotFoundException(
          'Order not found from find one order service',
        );
      }
      return order;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        'Something went wrong from find one order service',
      );
    }
  }

  async findAllByUserId(userId: number): Promise<Order[]> {
    try {
      const orders = await this.orderRepository.find({
        where: { user: { id: userId } },
      });
      if (orders.length === 0) {
        throw new NotFoundException(
          `Order of user with ID ${userId} not found from find all orders by user id service`,
        );
      }
      return orders;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        'Something went wrong from find all orders by user id service',
      );
    }
  }

  async update(id: number, updateOrderDto: UpdateOrderDto): Promise<Order> {
    try {
      const order = await this.orderRepository.findOne({ where: { id } });
      if (!order) {
        throw new NotFoundException(
          'Order not found from update order service',
        );
      }
      return this.orderRepository.save({ ...order, ...updateOrderDto });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        'Something went wrong from update order service',
      );
    }
  }

  async remove(id: number): Promise<Order> {
    try {
      const order = await this.orderRepository.findOne({ where: { id } });
      if (!order) {
        throw new NotFoundException(
          'Order not found from remove order service',
        );
      }
      return this.orderRepository.remove(order);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Something went wrong');
    }
  }

  // TODO: service for seed orders
  async createOrderSeed(userId: number, createOrderWithFullAttributesDto: CreateOrderFullAttributesDto): Promise<Order> {
    try {
      const order = this.orderRepository.create({
        user: { id: userId },
        ...createOrderWithFullAttributesDto,
      });
      return this.orderRepository.save(order);
    } catch (error) {
      throw new BadRequestException('Failed to create order seed');
    }
  }
}
