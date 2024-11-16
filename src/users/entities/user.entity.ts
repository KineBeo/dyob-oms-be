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

@Entity()
export default class User {

  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ nullable: false })
  fullname: string;
  
  @Index('phone_number_idx', {unique: true})
  @Column({ nullable: false })
  phone_number: string;

  @Column()
  password_hash: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER
  })
  role: Role;

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

  @OneToOne(() => UserStatus, status => status.user)
  status: UserStatus;

  @OneToMany(() => UserAddress, address => address.user)
  addresses: UserAddress[];
}
