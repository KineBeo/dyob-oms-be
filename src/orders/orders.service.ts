import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { InjectRepository } from '@nestjs/typeorm';
import Order from './entities/order.entity';
import { Repository } from 'typeorm';
import { CartService } from 'src/cart/cart.service';
import { AffiliateService } from 'src/affiliate/affiliate.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    // maybe create cart module would be better
    private cartService: CartService,
    private affiliateService: AffiliateService
  ) { }


  async create(userId: number, createOrderDto: CreateOrderDto): Promise<Order> {
    const cartItems = await this.cartService.getCart(userId);
    if (!cartItems || cartItems.length === 0) {
      throw new Error('Cart is empty');
    }

    const total_amount = cartItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0).toString();

    const affiliate = await this.affiliateService.findAffiliateByUserId(userId);

    const order = this.orderRepository.create({
      ...createOrderDto,
      user: { id: userId },
      affiliate: affiliate,
      total_amount,
    });

    const savedOrder = await this.orderRepository.save(order);
    return savedOrder;
  }

  async findAll(): Promise<Order[]> {
    try {
      const orders = await this.orderRepository.find();
      return orders;
    }
    catch (error) {
      throw new Error('Something went wrong');
    }
  }

  async findOne(id: number): Promise<Order> {
    try {
      const order = await this.orderRepository.findOne({ where: { id } });
      if (!order) {
        throw new Error('Order not found');
      }
      return order;
    } catch (error) {
      throw new Error('Something went wrong');
    }
  }

  async update(id: number, updateOrderDto: UpdateOrderDto): Promise<Order> {
    try {
      const order = await this.orderRepository.findOne({ where: { id } });
      if (!order) {
        throw new Error('Order not found');
      }
      return this.orderRepository.save({ ...order, ...updateOrderDto });
    } catch (error) {
      throw new Error('Something went wrong');
    }
  }

  async remove(id: number): Promise<Order> {
    try {
      const order = await this.orderRepository.findOne({ where: { id } });
      if (!order) {
        throw new Error('Order not found');
      }
      return this.orderRepository.remove(order);
    } catch (error) {
      throw new Error('Something went wrong');
    }
  }
}
