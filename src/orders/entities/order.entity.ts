
import AffiliateProfile from '../../affiliate/entities/affiliate.entity';
import User from '../../users/entities/user.entity';
import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { OrderStatus } from '../../enum/order-status';
import OrderProduct from "../../order_product/entities/order_product.entity";

@Entity()
export default class Order {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @ManyToOne(() => User, user => user.orders)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => AffiliateProfile, affiliate => affiliate.orders)
    @JoinColumn({ name: 'affiliate_id' })
    affiliate: AffiliateProfile;

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

    @OneToMany(() => OrderProduct, orderProduct => orderProduct.order)
    orderProduct: OrderProduct[];
}
