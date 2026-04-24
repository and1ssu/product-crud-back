import { Prisma, PrismaClient, ProductStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Seed user (owner of seed products)
  const seedUser = await prisma.user.upsert({
    where: { email: 'admin@seed.com' },
    update: {},
    create: {
      name: 'Seed Admin',
      email: 'admin@seed.com',
      password: await bcrypt.hash('password123', 12),
    },
  });

  // Root categories
  const eletronicos = await prisma.category.upsert({
    where: { name: 'Eletrônicos' },
    update: {},
    create: { name: 'Eletrônicos', description: 'Produtos eletrônicos em geral' },
  });

  const roupas = await prisma.category.upsert({
    where: { name: 'Roupas' },
    update: {},
    create: { name: 'Roupas', description: 'Vestuário masculino e feminino' },
  });

  const alimentos = await prisma.category.upsert({
    where: { name: 'Alimentos' },
    update: {},
    create: { name: 'Alimentos', description: 'Alimentos e bebidas' },
  });

  const esportes = await prisma.category.upsert({
    where: { name: 'Esportes' },
    update: {},
    create: { name: 'Esportes', description: 'Artigos esportivos' },
  });

  // Sub-category
  const smartphones = await prisma.category.upsert({
    where: { name: 'Smartphones' },
    update: {},
    create: {
      name: 'Smartphones',
      description: 'Celulares e acessórios',
      parentId: eletronicos.id,
    },
  });

  // Products — update sets ownerId to fix existing rows with null ownerId
  await prisma.product.upsert({
    where: { name: 'Smartphone XYZ Pro' },
    update: { ownerId: seedUser.id },
    create: {
      name: 'Smartphone XYZ Pro',
      description: 'Smartphone de última geração com câmera de 108MP',
      price: new Prisma.Decimal('1299.99'),
      stock: 50,
      status: ProductStatus.ACTIVE,
      ownerId: seedUser.id,
      categories: {
        create: [
          { categoryId: eletronicos.id },
          { categoryId: smartphones.id },
        ],
      },
    },
  });

  await prisma.product.upsert({
    where: { name: 'Notebook UltraBook 14"' },
    update: { ownerId: seedUser.id },
    create: {
      name: 'Notebook UltraBook 14"',
      description: 'Notebook leve e potente para uso profissional',
      price: new Prisma.Decimal('3499.90'),
      stock: 20,
      status: ProductStatus.ACTIVE,
      ownerId: seedUser.id,
      categories: {
        create: [{ categoryId: eletronicos.id }],
      },
    },
  });

  await prisma.product.upsert({
    where: { name: 'Camiseta Dry-Fit Masculina' },
    update: { ownerId: seedUser.id },
    create: {
      name: 'Camiseta Dry-Fit Masculina',
      description: 'Camiseta esportiva com tecnologia dry-fit',
      price: new Prisma.Decimal('79.90'),
      stock: 200,
      status: ProductStatus.ACTIVE,
      ownerId: seedUser.id,
      categories: {
        create: [
          { categoryId: roupas.id },
          { categoryId: esportes.id },
        ],
      },
    },
  });

  await prisma.product.upsert({
    where: { name: 'Whey Protein 1kg' },
    update: { ownerId: seedUser.id },
    create: {
      name: 'Whey Protein 1kg',
      description: 'Suplemento proteico para ganho de massa muscular',
      price: new Prisma.Decimal('189.90'),
      stock: 80,
      status: ProductStatus.ACTIVE,
      ownerId: seedUser.id,
      categories: {
        create: [
          { categoryId: alimentos.id },
          { categoryId: esportes.id },
        ],
      },
    },
  });

  await prisma.product.upsert({
    where: { name: 'Tênis Running Pro' },
    update: { ownerId: seedUser.id },
    create: {
      name: 'Tênis Running Pro',
      description: 'Tênis para corrida com amortecimento avançado',
      price: new Prisma.Decimal('459.00'),
      stock: 35,
      status: ProductStatus.ACTIVE,
      ownerId: seedUser.id,
      categories: {
        create: [{ categoryId: esportes.id }],
      },
    },
  });

  await prisma.product.upsert({
    where: { name: 'Fone Bluetooth ANC' },
    update: { ownerId: seedUser.id },
    create: {
      name: 'Fone Bluetooth ANC',
      description: 'Fone de ouvido com cancelamento ativo de ruído',
      price: new Prisma.Decimal('699.00'),
      stock: 60,
      status: ProductStatus.DRAFT,
      ownerId: seedUser.id,
      categories: {
        create: [{ categoryId: eletronicos.id }],
      },
    },
  });

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
