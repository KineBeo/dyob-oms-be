
import Order from "src/orders/entities/order.entity";
import User from "src/users/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export default class Affiliate {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    referral_code: string;

    @OneToOne(() => User, user => user.affiliate)
    @JoinColumn({ name: 'user_id' })    
    user: User;

    @ManyToOne(() => Affiliate, affiliate => affiliate.children)
    @JoinColumn({ name: 'parent_id' })  
    parent: Affiliate;

    @OneToMany(() => Affiliate, affiliate => affiliate.parent)
    children: Affiliate[];

    @Column()
    level: number;  

    @Column({type: 'text', default: '0'})
    commission: string; 

    @OneToMany(() => Order, order => order.affiliate)
    orders: Order[];
}
