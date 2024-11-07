import Order from "src/orders/entities/order.entity";
import { UserRank } from "../../enum/rank";
import User from "../../users/entities/user.entity";
import { PrimaryGeneratedColumn, OneToOne, JoinColumn, Column, CreateDateColumn, UpdateDateColumn, Entity, ManyToOne, OneToMany } from "typeorm";
import { UserAddress } from "src/user-address/entities/user-address.entity";

@Entity()
export class UserStatus {

    // !checked 1
    @PrimaryGeneratedColumn()
    id: number;

    // !checked 2
    @OneToOne(() => User, user => user.status)
    @JoinColumn({ name: 'user_id' })
    user: User;

    // !checked 3
    @Column()
    personal_referral_code: string;
  
    // !checked 4
    @Column({ default: '0' })
    total_purchase: string; 
  
    // !checked 5
    @Column({ default: 0 })
    total_orders: number;
   
    // !checked 6
    @Column()
    total_sales: string;

    @Column()
    commission: string

    /** 
     * * Referral code của Người giới thiệu
     */
    @ManyToOne(() => UserStatus, { nullable: true })
    @JoinColumn({ name: 'referrer_id' })
    referrer: UserStatus;

    /** 
     * * Người được giới thiệu
     */
    @OneToMany(() => UserStatus, userStatus => userStatus.referrer)
    referrals: UserStatus[];
  
    // !checked 7
    @UpdateDateColumn()
    last_rank_check: Date;

    // !checked 8
    @UpdateDateColumn()
    rank_achievement_date: Date;

    // !checked 9
    @Column({
      type: 'enum',
      enum: UserRank,
      default: UserRank.GUEST
    })
    user_rank: UserRank;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => Order, order => order.userStatus)
    orders: Order[];

}
