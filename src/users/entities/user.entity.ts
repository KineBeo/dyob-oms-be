import Affiliate from "src/affiliate/entities/affiliate.entity";
import { Rank } from "src/enum/rank";
import Order from "src/orders/entities/order.entity";
import { Column, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export default class User {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column({ nullable: false })
    fullname: string;

    @Column({ unique: true, nullable: false })
    phone_number: string;

    @Column({ unique: true, default: ''})
    email: string;

    @Column()
    password_hash: string;

    @Column({type: 'enum',  default: Rank.KHL, enum: Rank})
    rank: Rank;

    @Column({ default: '0' })
    total_purchase: string;

    @Column({type: 'text', default: '', nullable: false})
    bank_name: string;

    @Column({type: 'text', default: '', nullable: false})
    bank_account_number: string;

    @Column({ default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @Column('timestamp')
    updated_at: Date;

    @OneToMany(() => Order, order => order.user)
    orders: Order[];

    @OneToOne(() => Affiliate, affiliate => affiliate.user)
    affiliate: Affiliate;
}
