import { MigrationInterface, QueryRunner } from "typeorm";

export class InitMigration1741710395305 implements MigrationInterface {
    name = 'InitMigration1741710395305'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_transaction_type_enum" AS ENUM('COMMISSION', 'BONUS', 'RESET', 'PURCHASE', 'SALE')`);
        await queryRunner.query(`CREATE TABLE "user_transaction" ("id" SERIAL NOT NULL, "amount" character varying NOT NULL, "type" "public"."user_transaction_type_enum" NOT NULL, "description" character varying, "createdAt" TIMESTAMP NOT NULL, "userStatusId" integer, CONSTRAINT "PK_e36b77a5263ac0f191277c4c5d2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_category" ("id" SERIAL NOT NULL, "documentId" text NOT NULL, "name" text NOT NULL, "description" text, "parent_id" integer, CONSTRAINT "UQ_859cc53582ce6d3715904c8f054" UNIQUE ("documentId"), CONSTRAINT "UQ_96152d453aaea425b5afde3ae9f" UNIQUE ("name"), CONSTRAINT "PK_0dce9bc93c2d2c399982d04bef1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product" ("id" SERIAL NOT NULL, "documentId" text NOT NULL, "name" text NOT NULL, "description" text, "price" text NOT NULL DEFAULT '0', "stock" integer NOT NULL DEFAULT '0', "type" text, "attributes" jsonb, "createdAt" TIMESTAMP NOT NULL, "updatedAt" TIMESTAMP NOT NULL, "category_id" integer, CONSTRAINT "UQ_238e58f118aff7973203fb2e5e6" UNIQUE ("documentId"), CONSTRAINT "UQ_22cc43e9a74d7498546e9a63e77" UNIQUE ("name"), CONSTRAINT "PK_bebc9158e480b949565b4dc7a82" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "order_product" ("id" SERIAL NOT NULL, "quantity" integer NOT NULL DEFAULT '0', "price" text NOT NULL DEFAULT '0', "order_id" integer, "product_id" integer, CONSTRAINT "PK_539ede39e518562dfdadfddb492" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_address" ("id" SERIAL NOT NULL, "receiver_name" character varying NOT NULL, "phone_number" character varying NOT NULL, "province" character varying NOT NULL, "district" character varying NOT NULL, "ward" character varying NOT NULL, "street_address" character varying NOT NULL, "notes" character varying, "is_default" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer, CONSTRAINT "PK_302d96673413455481d5ff4022a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."order_status_enum" AS ENUM('NOT_START_YET', 'ON_GOING', 'COMPLETED')`);
        await queryRunner.query(`CREATE TABLE "order" ("id" SERIAL NOT NULL, "total_amount" character varying NOT NULL, "shipping_address_id" integer NOT NULL, "snapshot_receiver_name" character varying NOT NULL, "snapshot_phone_number" character varying NOT NULL, "snapshot_full_address" character varying NOT NULL, "snapshot_notes" character varying, "status" "public"."order_status_enum" NOT NULL DEFAULT 'NOT_START_YET', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updateAt" TIMESTAMP NOT NULL, "user_id" integer, "from_user_status_with_id" integer, CONSTRAINT "PK_1031171c13130102495201e3e20" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."user_status_user_type_enum" AS ENUM('NORMAL', 'AFFILIATE')`);
        await queryRunner.query(`CREATE TYPE "public"."user_status_user_class_enum" AS ENUM('NONE', 'BASIC', 'VIP')`);
        await queryRunner.query(`CREATE TYPE "public"."user_status_user_rank_enum" AS ENUM('GUEST', 'NVKD', 'TPKD', 'GDKD', 'GDV', 'GDKV')`);
        await queryRunner.query(`CREATE TABLE "user_status" ("id" SERIAL NOT NULL, "personal_referral_code" character varying NOT NULL, "total_purchase" character varying NOT NULL DEFAULT '0', "total_orders" integer NOT NULL DEFAULT '0', "total_sales" character varying NOT NULL DEFAULT '0', "bonus" character varying NOT NULL DEFAULT '0', "commission" character varying NOT NULL DEFAULT '0', "user_type" "public"."user_status_user_type_enum" NOT NULL DEFAULT 'NORMAL', "user_class" "public"."user_status_user_class_enum" NOT NULL DEFAULT 'NONE', "last_rank_check" TIMESTAMP NOT NULL, "rank_achievement_date" TIMESTAMP NOT NULL, "user_rank" "public"."user_status_user_rank_enum" NOT NULL DEFAULT 'GUEST', "createdAt" TIMESTAMP NOT NULL, "updatedAt" TIMESTAMP NOT NULL, "user_id" integer, "referrer_id" integer, CONSTRAINT "REL_9bab6c49e02f517fd2efd6c1a9" UNIQUE ("user_id"), CONSTRAINT "PK_892a2061d6a04a7e2efe4c26d6f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('ADMIN', 'USER')`);
        await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "fullname" character varying NOT NULL, "phone_number" character varying NOT NULL, "password_hash" character varying NOT NULL, "cccd" character varying NOT NULL DEFAULT '0123456789', "bank_name" character varying NOT NULL DEFAULT 'VietComBank', "bank_account_number" character varying NOT NULL DEFAULT '0123456789', "role" "public"."user_role_enum" NOT NULL DEFAULT 'USER', "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "phone_number_idx" ON "user" ("phone_number") `);
        await queryRunner.query(`CREATE TABLE "notification" ("id" SERIAL NOT NULL, "message" character varying NOT NULL, "is_read" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer, CONSTRAINT "PK_705b6c7cdf9b2c2ff7ac7872cb7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "commission_history" ("id" SERIAL NOT NULL, "monthly_commission" character varying NOT NULL, "bonus" character varying NOT NULL, "total_sale" character varying NOT NULL, "month" integer NOT NULL, "year" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "user_status_id" integer NOT NULL, CONSTRAINT "PK_7021025686ad010a4720af2d702" PRIMARY KEY ("id")); COMMENT ON COLUMN "commission_history"."month" IS 'Tháng ghi nhận (1-12)'; COMMENT ON COLUMN "commission_history"."year" IS 'Năm ghi nhận'`);
        await queryRunner.query(`CREATE INDEX "idx_user_status" ON "commission_history" ("user_status_id") `);
        await queryRunner.query(`CREATE TABLE "cart" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "product_id" integer NOT NULL, "quantity" integer NOT NULL, "price" text NOT NULL, CONSTRAINT "PK_c524ec48751b9b5bcfbf6e59be7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "refresh_token" ("id" SERIAL NOT NULL, "token" character varying NOT NULL, "userId" integer NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b575dd3c21fb0831013c909e7fe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user_transaction" ADD CONSTRAINT "FK_b5a0b53336a46c3de617a1a9ec9" FOREIGN KEY ("userStatusId") REFERENCES "user_status"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_category" ADD CONSTRAINT "FK_17f434523d4566716f2b1c528a8" FOREIGN KEY ("parent_id") REFERENCES "product_category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product" ADD CONSTRAINT "FK_0dce9bc93c2d2c399982d04bef1" FOREIGN KEY ("category_id") REFERENCES "product_category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_product" ADD CONSTRAINT "FK_ea143999ecfa6a152f2202895e2" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_product" ADD CONSTRAINT "FK_400f1584bf37c21172da3b15e2d" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_address" ADD CONSTRAINT "FK_29d6df815a78e4c8291d3cf5e53" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order" ADD CONSTRAINT "FK_199e32a02ddc0f47cd93181d8fd" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order" ADD CONSTRAINT "FK_481da762f808be989e2cab37c78" FOREIGN KEY ("from_user_status_with_id") REFERENCES "user_status"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order" ADD CONSTRAINT "FK_19b0c6293443d1b464f604c3316" FOREIGN KEY ("shipping_address_id") REFERENCES "user_address"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_status" ADD CONSTRAINT "FK_9bab6c49e02f517fd2efd6c1a91" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_status" ADD CONSTRAINT "FK_eeb8263dc3fa910347497121526" FOREIGN KEY ("referrer_id") REFERENCES "user_status"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "FK_928b7aa1754e08e1ed7052cb9d8" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "commission_history" ADD CONSTRAINT "FK_e0d5fb07cc67bad2e1c289ad813" FOREIGN KEY ("user_status_id") REFERENCES "user_status"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "refresh_token" ADD CONSTRAINT "FK_8e913e288156c133999341156ad" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "refresh_token" DROP CONSTRAINT "FK_8e913e288156c133999341156ad"`);
        await queryRunner.query(`ALTER TABLE "commission_history" DROP CONSTRAINT "FK_e0d5fb07cc67bad2e1c289ad813"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "FK_928b7aa1754e08e1ed7052cb9d8"`);
        await queryRunner.query(`ALTER TABLE "user_status" DROP CONSTRAINT "FK_eeb8263dc3fa910347497121526"`);
        await queryRunner.query(`ALTER TABLE "user_status" DROP CONSTRAINT "FK_9bab6c49e02f517fd2efd6c1a91"`);
        await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT "FK_19b0c6293443d1b464f604c3316"`);
        await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT "FK_481da762f808be989e2cab37c78"`);
        await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT "FK_199e32a02ddc0f47cd93181d8fd"`);
        await queryRunner.query(`ALTER TABLE "user_address" DROP CONSTRAINT "FK_29d6df815a78e4c8291d3cf5e53"`);
        await queryRunner.query(`ALTER TABLE "order_product" DROP CONSTRAINT "FK_400f1584bf37c21172da3b15e2d"`);
        await queryRunner.query(`ALTER TABLE "order_product" DROP CONSTRAINT "FK_ea143999ecfa6a152f2202895e2"`);
        await queryRunner.query(`ALTER TABLE "product" DROP CONSTRAINT "FK_0dce9bc93c2d2c399982d04bef1"`);
        await queryRunner.query(`ALTER TABLE "product_category" DROP CONSTRAINT "FK_17f434523d4566716f2b1c528a8"`);
        await queryRunner.query(`ALTER TABLE "user_transaction" DROP CONSTRAINT "FK_b5a0b53336a46c3de617a1a9ec9"`);
        await queryRunner.query(`DROP TABLE "refresh_token"`);
        await queryRunner.query(`DROP TABLE "cart"`);
        await queryRunner.query(`DROP INDEX "public"."idx_user_status"`);
        await queryRunner.query(`DROP TABLE "commission_history"`);
        await queryRunner.query(`DROP TABLE "notification"`);
        await queryRunner.query(`DROP INDEX "public"."phone_number_idx"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
        await queryRunner.query(`DROP TABLE "user_status"`);
        await queryRunner.query(`DROP TYPE "public"."user_status_user_rank_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_status_user_class_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_status_user_type_enum"`);
        await queryRunner.query(`DROP TABLE "order"`);
        await queryRunner.query(`DROP TYPE "public"."order_status_enum"`);
        await queryRunner.query(`DROP TABLE "user_address"`);
        await queryRunner.query(`DROP TABLE "order_product"`);
        await queryRunner.query(`DROP TABLE "product"`);
        await queryRunner.query(`DROP TABLE "product_category"`);
        await queryRunner.query(`DROP TABLE "user_transaction"`);
        await queryRunner.query(`DROP TYPE "public"."user_transaction_type_enum"`);
    }

}
