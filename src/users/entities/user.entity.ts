import { UserStatus } from '../../user-status/entities/user-status.entity';
import AffiliateProfile from '../../affiliate-profile/entities/affiliate-profile.entity';
import Order from '../../orders/entities/order.entity';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export default class User {

  // ! checked
  @PrimaryGeneratedColumn('increment')
  id: number;

  // ! checked
  @Column({ nullable: false })
  fullname: string;
  
  // ! checked
  @Column({ unique: true, nullable: false })
  phone_number: string;

  // ! checked
  @Column({ unique: true })
  email: string;

  // ! checked
  @Column()
  password_hash: string;

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
  // ! checked
  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @OneToOne(() => AffiliateProfile, (affiliateProfile) => affiliateProfile.user)
  affiliateProfile: AffiliateProfile;

  @OneToOne(() => UserStatus, status => status.user)
  status: UserStatus;
  // ! checked
}
