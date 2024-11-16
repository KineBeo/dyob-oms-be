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
import { OrderStatus } from '../enum/order-status';
import { UsersService } from '../users/users.service';
import { OrderProductService } from '../order_product/order_product.service';
import { CreateOrderFullAttributesDto } from './dto/create-order-full-attributes.dto';
import { GoogleSheetService } from '../google-sheet/google-sheet.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserStatusService } from 'src/user-status/user-status.service';
import { UserAddressService } from 'src/user-address/user-address.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private cartService: CartService,
    private userService: UsersService,
    @Inject(forwardRef(() => OrderProductService))
    private orderProductService: OrderProductService,
    private googleSheetsService: GoogleSheetService,
    private userStatusService: UserStatusService,
    private eventEmitter: EventEmitter2,
    private userAddressService: UserAddressService,
  ) {
    // Listen for status changes from Google Sheets
    // this.eventEmitter.on(
    //   'order.status.changed',
    //   async (payload: { orderId: number; newStatus: OrderStatus }) => {
    //     // console.log(
    //     //   'Received status change event:',
    //     //   payload.orderId,
    //     //   payload.newStatus,
    //     // );
    //     await this.handleStatusChange(payload.orderId, payload.newStatus);
    //   },
    // );
  }

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const { user_id, referral_code_of_referrer, shipping_address_id } =
      createOrderDto;
    try {
      const user = await this.userService.findOne(user_id);
      if (!user) {
        throw new NotFoundException(
          `User with ID ${user_id} not found from create order service`,
        );
      }

      const shippingAddress =
        await this.userAddressService.findOne(shipping_address_id);
      if (!shippingAddress) {
        throw new NotFoundException(
          `Shipping address with ID ${shipping_address_id} 
           not found from create order service`,
        );
      }
      const cartItems = await this.cartService.getCart(user_id);
      if (!cartItems || cartItems.length === 0) {
        throw new Error('Cart is empty from create order service');
      }

      const total_amount = cartItems
        .reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)
        .toString();

      // * get user status by referral_code_of_referrer
      const userStatus =
        await this.userStatusService.findUserStatusByReferralCode(
          referral_code_of_referrer,
        );

      const order = this.orderRepository.create({
        user: { id: user_id },
        userStatus: userStatus || null,
        total_amount,
        shipping_address: shippingAddress,
        shipping_address_id: shippingAddress.id,
        snapshot_receiver_name: shippingAddress.receiver_name,
        snapshot_phone_number: shippingAddress.phone_number,
        snapshot_full_address: `${shippingAddress.street_address}, ${shippingAddress.ward}, ${shippingAddress.district}, ${shippingAddress.province}`,
        snapshot_notes: shippingAddress.notes,
        status: OrderStatus.NOT_START_YET,
        createdAt: new Date(),
        updateAt: new Date(),
      });
      const savedOrder = await this.orderRepository.save(order);

      // // ! Sync order to Google Sheet
      // await this.googleSheetsService.syncOrderToSheet(savedOrder);

      const orderItems = cartItems.map((item) => ({
        order_id: savedOrder.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
      }));
      await this.orderProductService.createMany(orderItems);
      await this.cartService.clearCart(user_id);
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

  async updateStatus(orderId: number, newStatus: OrderStatus): Promise<{ message: string }> {
    console.log('orderId: ', orderId);
    try {
      const currentOrder = await this.findOne(orderId);
      const currentStatus = currentOrder.status;
      if (currentStatus !== newStatus) {
        await this.update(orderId, {
          user_id: currentOrder.user.id,
          shipping_address_id: currentOrder.shipping_address_id,
          status: newStatus,
        });

        if (newStatus === OrderStatus.COMPLETED && currentStatus !== OrderStatus.COMPLETED) {
          this.eventEmitter.emit('order.completed', {
            userId: currentOrder.user.id,
            orderAmount: currentOrder.total_amount,
          });
        }

        if (currentStatus === OrderStatus.COMPLETED && newStatus !== OrderStatus.COMPLETED) {
          this.eventEmitter.emit('order.uncompleted', {
            userId: currentOrder.user.id,
            orderAmount: currentOrder.total_amount,
          });
        }
      }

      return { message: `Order status updated from ${currentStatus} to ${newStatus} successfully` };
    } catch (error) {
      throw new BadRequestException(
        `Failed to admin's update order status: ${error.message}`,
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
        // console.log(`Updating order ${orderId} status from ${order.status} to ${newStatus}`);

        const previousStatus = order.status;

        await this.update(orderId, {
          user_id: order.user.id,
          shipping_address_id: order.shipping_address_id,
          status: newStatus,
        });

        // ! if the new status is COMPLETED, emit event to update user's total purchase
        if (
          newStatus === OrderStatus.COMPLETED &&
          previousStatus !== OrderStatus.COMPLETED
        ) {
          // console.log(`Order ${orderId} marked as completed. Emitting order.completed event`);
          this.eventEmitter.emit('order.completed', {
            userId: order.user.id,
            orderAmount: order.total_amount,
          });
        }

        // ! If the previous status was COMPLETED but new status isn't, we need to subtract
        if (
          previousStatus === OrderStatus.COMPLETED &&
          newStatus !== OrderStatus.COMPLETED
        ) {
          // console.log(`Order ${orderId} unmarked as completed. Emitting order.uncompleted event`);
          this.eventEmitter.emit('order.uncompleted', {
            userId: order.user.id,
            orderAmount: order.total_amount,
          });
        }
      }
      // else {
      //   console.log(`Order ${orderId} status unchanged: ${newStatus}`);
      // }
    } catch (error) {
      // console.error(
      //   `Failed to handle status change for order ${orderId}:`,
      //   error,
      // );
      throw error; // Re-throw the error for proper error handling upstream
    }
  }

  async update(id: number, updateOrderDto: UpdateOrderDto) {
    try {
      const order = await this.findOne(id);
      // Validate user exists
      const user = await this.userService.findOne(updateOrderDto.user_id);
      if (!user) {
        throw new NotFoundException(
          `User with ID ${updateOrderDto.user_id} not found`,
        );
      }
      const updateAddress = await this.userAddressService.findOne(
        updateOrderDto.shipping_address_id,
      );
      // Update order
      const updatedOrder = Object.assign(order, {
        user: { id: updateOrderDto.user_id },
        address: updateAddress || order.snapshot_full_address,
        status: updateOrderDto.status || order.status,
        updateAt: new Date(),
      });

      const savedOrder = await this.orderRepository.save(updatedOrder);

      // Sync updates to Google Sheet
      // await this.googleSheetsService.syncOrderToSheet(savedOrder);

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
        relations: ['user', 'userStatus'],
      });
      if (!order) {
        throw new NotFoundException(
          'Order not found from find one order service',
        );
      }

      // Remove password_hash from user object before returning
      if (order.user) {
        delete order.user.password_hash;
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
        relations: [
          'orderProduct', // Lấy quan hệ với bảng trung gian OrderProduct
          'orderProduct.product', // Lấy thông tin sản phẩm từ quan hệ với bảng trung gian
        ],
        order: {
          createdAt: 'DESC', // Sắp xếp theo thời gian tạo giảm dần
        },
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
      throw new Error(error);
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
