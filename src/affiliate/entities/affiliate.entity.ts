
import Order from "src/orders/entities/order.entity";
import User from "src/users/entities/user.entity";
import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export default class Affiliate {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({unique: true})
    referral_code: string;

    @OneToOne(() => User, user => user.affiliate)
    @JoinColumn({ name: 'user_id' })    
    user: User;

    @Column({ default: '0' })
    total_purchase: string;

    @Column({ default: '0' })
    personal_income: string;

    @Column({type: 'text', default: '0'})
    commission: string; 

    @Column({type: 'timestamp' })
    createdAt: Date;

    @BeforeInsert()
    updateCreatedAt() {
        this.createdAt = new Date(new Date().getTime());
    }

    @OneToMany(() => Order, order => order.affiliate)
    orders: Order[];
}
