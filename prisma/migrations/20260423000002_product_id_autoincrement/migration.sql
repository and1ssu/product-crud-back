-- Clear existing data before changing PK type (seed will repopulate)
TRUNCATE TABLE "product_categories";
TRUNCATE TABLE "products" CASCADE;

-- Drop FK and join table constraints
ALTER TABLE "product_categories" DROP CONSTRAINT "product_categories_productId_fkey";
ALTER TABLE "product_categories" DROP CONSTRAINT "product_categories_pkey";

-- Change products PK from TEXT/UUID to SERIAL autoincrement
ALTER TABLE "products" DROP CONSTRAINT "products_pkey";
ALTER TABLE "products" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "products" ALTER COLUMN "id" TYPE INTEGER USING (0);
CREATE SEQUENCE IF NOT EXISTS products_id_seq START 1;
ALTER TABLE "products" ALTER COLUMN "id" SET DEFAULT nextval('products_id_seq');
ALTER SEQUENCE products_id_seq OWNED BY "products"."id";
ALTER TABLE "products" ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");

-- Change product_categories.productId from TEXT to INTEGER
ALTER TABLE "product_categories" ALTER COLUMN "productId" TYPE INTEGER USING ("productId"::integer);
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_pkey" PRIMARY KEY ("productId", "categoryId");
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
