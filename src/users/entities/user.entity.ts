import { UserStatus } from '../../user-status/entities/user-status.entity';
import Order from '../../orders/entities/order.entity';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  Index,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Role } from '../../enum/role';
import { UserAddress } from 'src/user-address/entities/user-address.entity';
import { UserTransaction } from 'src/user-transactions/entities/user-transaction.entity';

@Entity()
export default class User {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ nullable: false })
  fullname: string;

  @Index('phone_number_idx', { unique: true })
  @Column({ nullable: false })
  phone_number: string;

  @Column()
  password_hash: string;

  @Column({
    default: '0123456789',
  })
  cccd: string;

  @Column({
    default: 'VietComBank',
  })
  bank_name: string;

  @Column({
    default: '0123456789',
  })
  bank_account_number: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER,
  })
  role: Role;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public updatedAt: Date;

  @BeforeInsert()
  updateCreatedAt() {
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  @BeforeUpdate()
  updateUpdatedAt() {
    this.updatedAt = new Date();
  }

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @OneToOne(() => UserStatus, (status) => status.user)
  status: UserStatus;

  @OneToMany(() => UserAddress, (address) => address.user)
  addresses: UserAddress[];

  @OneToMany(() => UserTransaction, (transaction) => transaction.user)
  transactions: UserTransaction[];
}
