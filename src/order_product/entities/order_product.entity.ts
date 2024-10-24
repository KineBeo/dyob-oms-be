import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import Order from "../../orders/entities/order.entity";
import Product from "../../products/entities/product.entity";

@Entity()
export default class OrderProduct {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Order, order => order.orderProduct)
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @ManyToOne(() => Product, product => product.orderProduct)
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @Column({ type: 'integer', default: 0, nullable: false })
    quantity: number;

    @Column({ type: 'text', default: '0', nullable: false })
    price: string;
}