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
import { AffiliateProfileService } from '../affiliate-profile/affiliate-profile.service';
import { OrderStatus } from '../enum/order-status';
import { UsersService } from '../users/users.service';
import { OrderProductService } from '../order_product/order_product.service';
import { CreateOrderFullAttributesDto } from './dto/create-order-full-attributes.dto';
import { GoogleSheetService } from '../google-sheet/google-sheet.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private cartService: CartService,
    private affiliateService: AffiliateProfileService,
    private userService: UsersService,
    @Inject(forwardRef(() => OrderProductService))
    private orderProductService: OrderProductService,
    private googleSheetsService: GoogleSheetService,
    private eventEmitter: EventEmitter2,
  ) {
    // Listen for status changes from Google Sheets
    this.eventEmitter.on(
      'order.status.changed',
      async (payload: { orderId: number; newStatus: OrderStatus }) => {
        // console.log(
        //   'Received status change event:',
        //   payload.orderId,
        //   payload.newStatus,
        // );
        await this.handleStatusChange(payload.orderId, payload.newStatus);
      },
    );
  }

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
        await this.affiliateService.findAffiliateByUserId(affiliate_id);

      const order = this.orderRepository.create({
        user: { id: userId },
        affiliate: affiliate ? { id: affiliate.id } : null,
        total_amount,
        address: createOrderDto.address,
        status: OrderStatus.NOT_START_YET,
        createdAt: new Date(),
        updateAt: new Date(),
      });
      const savedOrder = await this.orderRepository.save(order);

      // ! Sync order to Google Sheet
      await this.googleSheetsService.syncOrderToSheet(savedOrder);
  
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

  private async handleStatusChange(orderId: number, newStatus: OrderStatus) {
    try {
      // console.log('Handling status change for order', orderId);
      const order = await this.findOne(orderId);

      if (!order) {
        throw new NotFoundException(`Order with ID ${orderId} not found`);
      }

      if (order.status !== newStatus) {
        // console.log(
        //   'Updating order status. Current affiliate:',
        //   order.affiliate?.id || 'none',
        // );

        await this.update(orderId, {
          user_id: order.user.id,
          address: order.address,
          status: newStatus,
          affiliate_id: order.affiliate?.id || null,
        });
      } 
      // else {
      //   console.log(`Order ${orderId} already has status ${newStatus}`);
      // }
    } catch (error) {
      console.error(
        `Failed to handle status change for order ${orderId}:`,
        error,
      );
      throw error; // Re-throw the error for proper error handling upstream
    }
  }

  async update(id: number, updateOrderDto: UpdateOrderDto) {
    try {
      const order = await this.findOne(id);
      // console.log(
      //   'Updating order:',
      //   id,
      //   'Current affiliate ID:',
      //   order.affiliate?.id || 'none',
      // );

      // Validate user exists
      const user = await this.userService.findOne(updateOrderDto.user_id);
      if (!user) {
        throw new NotFoundException(
          `User with ID ${updateOrderDto.user_id} not found`,
        );
      }

      // Handle affiliate update
      let affiliateEntity = null;
      if (
        updateOrderDto.affiliate_id !== undefined &&
        updateOrderDto.affiliate_id !== null
      ) {
        const affiliate = await this.affiliateService.findAffiliateByUserId(
          updateOrderDto.affiliate_id,
        );
        if (!affiliate) {
          throw new NotFoundException(
            `Affiliate with ID ${updateOrderDto.affiliate_id} not found`,
          );
        }
        affiliateEntity = { id: affiliate.id };
      } else if (order.affiliate) {
        // Preserve existing affiliate if none specified in update
        affiliateEntity = { id: order.affiliate.id };
      }

      // Update order
      const updatedOrder = Object.assign(order, {
        user: { id: updateOrderDto.user_id },
        affiliate: affiliateEntity,
        address: updateOrderDto.address || order.address,
        status: updateOrderDto.status || order.status,
        updateAt: new Date(),
      });

      const savedOrder = await this.orderRepository.save(updatedOrder);

      // Sync updates to Google Sheet
      await this.googleSheetsService.syncOrderToSheet(savedOrder);

      return savedOrder;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update order: ${error.message}`);
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
      const order = await this.orderRepository.findOne({
        where: { id },
        relations: ['user', 'affiliate'],
      });
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
  async createOrderSeed(
    userId: number,
    createOrderWithFullAttributesDto: CreateOrderFullAttributesDto,
  ): Promise<Order> {
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
