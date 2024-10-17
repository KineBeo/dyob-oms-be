import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderProductDto } from './dto/create-order_product.dto';
import { UpdateOrderProductDto } from './dto/update-order_product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import OrderProduct from './entities/order_product.entity';
import { Repository } from 'typeorm';
import { OrdersService } from 'src/orders/orders.service';
import { ProductsService } from 'src/products/products.service';

@Injectable()
export class OrderProductService {
  constructor(
    @InjectRepository(OrderProduct)
    private orderProductRepository: Repository<OrderProduct>,
    @Inject(forwardRef(() => OrdersService))
    private ordersService: OrdersService,
    private productsService: ProductsService
  ) {
  }

  async create(createOrderProductDto: CreateOrderProductDto): Promise<OrderProduct> {
    try {
      const { order_id, product_id, quantity, price } = createOrderProductDto;

      const order = await this.ordersService.findOne(order_id);
      if (!order) {
        throw new NotFoundException(`Order with ID ${order_id} not found`);
      }

      const product = await this.productsService.findOne(product_id);
      if (!product) {
        throw new NotFoundException(`Product with ID ${product_id} not found`);
      }

      const newOrderProduct = this.orderProductRepository.create({
        order: { id: order_id },
        product: { id: product_id },
        quantity,
        price
      });

      return await this.orderProductRepository.save(newOrderProduct);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Something went wrong from create order product');
    }
  }

  async createMany(items: CreateOrderProductDto[]): Promise<OrderProduct[]> {
    try {
      console.log('Received items:', items);  
      const createdItems: OrderProduct[] = [];

      for (const item of items) {
        const { order_id, product_id, quantity, price } = item;

        const order = await this.ordersService.findOne(order_id);
        if (!order) {
          throw new NotFoundException(`Order with ID ${order_id} not found`);
        }

        const product = await this.productsService.findOne(product_id);
        if (!product) {
          throw new NotFoundException(`Product with ID ${product_id} not found`);
        }

        const newOrderProduct = this.orderProductRepository.create({
          order: { id: order_id },
          product: { id: product_id },
          quantity,
          price
        });

        const savedTime = await this.orderProductRepository.save(newOrderProduct);
        createdItems.push(savedTime);
      }

      return createdItems;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Something went wrong from create many order product');
    }
  }

  async findAll() {
    try {

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Something went wrong');
    }
  }

  async findOne(id: number) {
    try {

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Something went wrong');
    }
  }

  async update(id: number, updateOrderProductDto: UpdateOrderProductDto) {
    try {

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Something went wrong');
    }
  }

  async remove(id: number) {
    try {

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Something went wrong');
    }
  }
}
