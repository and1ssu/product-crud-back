-- Add ownerId to products (nullable first to not break existing rows)
ALTER TABLE "products" ADD COLUMN "ownerId" TEXT;

-- FK to users
ALTER TABLE "products" ADD CONSTRAINT "products_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
