import Affiliate from "src/affiliate/entities/affiliate.entity";
import { Rank } from "src/enum/rank";
import Order from "src/orders/entities/order.entity";
import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export default class Cart {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column({type: 'int', nullable: false })
    user_id: number;

    @Column({type: 'int', nullable: false })
    product_id: number;

    @Column({type: 'int', nullable: false })
    quantity: number;

    @Column({type: 'text', nullable: false })
    price: string;
}
