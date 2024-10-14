import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import Product from './product.entity';

@Entity()
export default class ProductCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', nullable: false, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', nullable: true })
  parent_id: number;

  @ManyToOne(() => ProductCategory, (category) => category.children)
  @JoinColumn({ name: 'parent_id' })
  parent: ProductCategory;

  @OneToMany(() => ProductCategory, (category) => category.parent)
  children: ProductCategory[];

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];
}
