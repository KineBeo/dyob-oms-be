import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import ProductCategory from './product_category.entity';
import OrderProductItem from 'src/orders/entities/order_product_item.entity';

@Entity()
export default class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', nullable: false, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', default: '0', nullable: false })
  price: string;

  @Column({ type: 'integer', default: 0, nullable: false })
  stock: number;

  @ManyToOne(() => ProductCategory, (category) => category.products)
  @JoinColumn({ name: 'category_id' })
  category: ProductCategory;

  @Column({ type: 'text', nullable: true })
  type: string;

  @Column({ type: 'jsonb', nullable: true })
  attributes: object;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  last_update: Date;

  @OneToMany(
    () => OrderProductItem,
    (orderProductItem) => orderProductItem.product,
  )
  orderProductItems: OrderProductItem[];
}
