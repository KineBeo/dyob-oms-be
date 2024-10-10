import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import Order from "./order.entity";
import Product from "src/products/entities/product.entity";

@Entity()
export default class OrderProductItem {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Order, order => order.orderProductItems)
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @ManyToOne(() => Product, product => product.orderProductItems)
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @Column({ type: 'integer', default: 0, nullable: false })
    quantity: number;

    @Column({ type: 'text', default: '0', nullable: false })
    price: string;
}