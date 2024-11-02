import { UserStatus } from '../../user-status/entities/user-status.entity';
import AffiliateProfile from '../../affiliate-profile/entities/affiliate-profile.entity';
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

@Entity()
export default class User {

  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ nullable: false })
  fullname: string;
  
  @Index('phone_number_idx')
  @Column({ nullable: false })
  phone_number: string;

  @Index('email_idx', { unique: true })
  @Column({ unique: true })
  email: string;

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

  @OneToOne(() => AffiliateProfile, (affiliateProfile) => affiliateProfile.user)
  affiliateProfile: AffiliateProfile;

  @OneToOne(() => UserStatus, status => status.user)
  status: UserStatus;
}
