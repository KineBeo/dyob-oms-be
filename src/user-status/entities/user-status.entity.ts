import { UserRank } from '../../enum/rank';
import User from '../../users/entities/user.entity';
import {
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { UserType } from '../../enum/user_type';
import { UserClass } from '../../enum/user-class';
import { UserTransaction } from '../../user-transactions/entities/user-transaction.entity';
import Order from '../../orders/entities/order.entity';

@Entity()
export class UserStatus {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, (user) => user.status)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  personal_referral_code: string;

  @Column({ default: '0' })
  total_purchase: string;

  @Column({ default: 0 })
  total_orders: number;

  @Column({ default: '0' })
  total_sales: string;

  @Column({ default: '0' })
  bonus: string;

  // @Column({ default: '0' })
  // group_sales: string;

  // @Column({ default: '0' })
  // group_commission: string;

  @Column({ default: '0' })
  commission: string;

  @Column({
    type: 'enum',
    enum: UserType,
    default: UserType.NORMAL,
  })
  user_type: UserType;

  @Column({
    type: 'enum',
    enum: UserClass,
    default: UserClass.NONE,
  })
  user_class: UserClass;

  /**
   * * Referral code của Người giới thiệu
   */
  @ManyToOne(() => UserStatus, { nullable: true })
  @JoinColumn({ name: 'referrer_id' })
  referrer: UserStatus;

  /**
   * * Người được giới thiệu
   */
  @OneToMany(() => UserStatus, (userStatus) => userStatus.referrer)
  referrals: UserStatus[];

  @Column()
  last_rank_check: Date;

  @Column()
  rank_achievement_date: Date;

  @Column({
    type: 'enum',
    enum: UserRank,
    default: UserRank.GUEST,
  })
  user_rank: UserRank;

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;

  @BeforeInsert()
  updateCreatedAt() {
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.last_rank_check = new Date();
    this.rank_achievement_date = new Date();
  }

  @BeforeUpdate()
  updateUpdatedAt() {
    this.updatedAt = new Date();
  }

  @OneToMany(() => Order, (order) => order.userStatus)
  orders: Order[];

  @OneToMany(
    () => UserTransaction,
    (userTransaction) => userTransaction.userStatus,
  )
  userTransactions: UserTransaction[];
}
