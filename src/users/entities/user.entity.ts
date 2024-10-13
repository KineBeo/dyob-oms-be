import Affiliate from "src/affiliate/entities/affiliate.entity";
import { Rank } from "src/enum/rank";
import Order from "src/orders/entities/order.entity";
import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";

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

    @Column({ type: 'timestamp' })
    public createdAt: Date;

    @Column({ type: 'timestamp' })
    public updatedAt: Date;

    @BeforeInsert()
    updateCreatedAt() {
        this.createdAt = new Date(new Date().getTime());
        this.updatedAt = new Date(new Date().getTime());
    }

    @BeforeUpdate()
    updateUpdatedAt() {
        this.updatedAt = new Date(new Date().getTime());
    }

    @OneToMany(() => Order, order => order.user)
    orders: Order[];

    @OneToOne(() => Affiliate, affiliate => affiliate.user)
    affiliate: Affiliate;
}
