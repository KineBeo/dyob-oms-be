
import User from '../../users/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { OrderStatus } from '../../enum/order-status';
import OrderProduct from "../../order_product/entities/order_product.entity";
import { UserStatus } from 'src/user-status/entities/user-status.entity';
import { UserAddress } from 'src/user-address/entities/user-address.entity';

@Entity()
export default class Order {
    @PrimaryGeneratedColumn('increment')
    id: number;

    // ! checked 1
    @ManyToOne(() => User, user => user.orders)
    @JoinColumn({ name: 'user_id' })
    user: User;

    // ! checked 2
    @ManyToOne(() => UserStatus, userStatus => userStatus.orders)
    @JoinColumn({ name: 'from_user_status_with_id' })
    userStatus: UserStatus;

    // ! checked 3
    @Column()
    total_amount: string;

    // ! checked 4 
    // TODO: update sau 
    // ! backup for sure
    // @Column({ nullable: false })
    // address: string;

    /**
     * from here it will be risky
     */
    @Column()
    shipping_address_id: number;

    @ManyToOne(() => UserAddress)
    @JoinColumn({ name: 'shipping_address_id' })
    shipping_address: UserAddress;

    @Column()
    snapshot_receiver_name: string;

    @Column()
    snapshot_phone_number: string

    @Column()
    snapshot_full_address: string;

    @Column({ nullable: true })
    snapshot_notes: string;

    
    // ! checked 5
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
