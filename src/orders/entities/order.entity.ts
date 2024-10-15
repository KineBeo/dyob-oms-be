
import Affiliate from "src/affiliate/entities/affiliate.entity";
import User from "src/users/entities/user.entity";
import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import OrderProductItem from "./order_product_item.entity";
import { OrderStatus } from "src/enum/order-status";

@Entity()
export default class Order {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @ManyToOne(() => User, user => user.orders)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Affiliate, affiliate => affiliate.orders)
    @JoinColumn({ name: 'affiliate_id' })
    affiliate: Affiliate;

    @Column()
    total_amount: string;

    @Column({ nullable: false })
    address: string;
    
    @Column({type: 'enum', default: OrderStatus.NOT_START_YET, enum: OrderStatus})
    status: string;

    @Column({type: 'timestamp' })
    createdAt: Date;

    @BeforeInsert()
    updateCreatedAt() {
        this.createdAt = new Date(new Date().getTime());
    }

    @OneToMany(() => OrderProductItem, orderProductItem => orderProductItem.order)
    orderProductItems: OrderProductItem[];
}
