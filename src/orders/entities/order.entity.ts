
import AffiliateProfile from '../../affiliate-profile/entities/affiliate-profile.entity';
import User from '../../users/entities/user.entity';
import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { OrderStatus } from '../../enum/order-status';
import OrderProduct from "../../order_product/entities/order_product.entity";

@Entity()
export default class Order {
    @PrimaryGeneratedColumn('increment')
    id: number;

    // ! checked
    @ManyToOne(() => User, user => user.orders)
    @JoinColumn({ name: 'user_id' })
    user: User;

    // ! checked
    @ManyToOne(() => AffiliateProfile, affiliate => affiliate.orders)
    @JoinColumn({ name: 'affiliate_id' })
    affiliate: AffiliateProfile;

    // ! checked
    @Column()
    total_amount: string;

    // ! checked
    @Column({ nullable: false })
    address: string;
    
    // ! checked
    @Column({type: 'enum', default: OrderStatus.NOT_START_YET, enum: OrderStatus})
    status: string;

    // !checked 
    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    // !checked
    @Column()
    updateAt: Date; 

    @OneToMany(() => OrderProduct, orderProduct => orderProduct.order)
    orderProduct: OrderProduct[];
}
