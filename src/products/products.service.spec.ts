import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { AppException } from '../common/exceptions/app.exception';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from './products.service';

const makeProduct = (overrides = {}) => ({
  id: 1,
  name: 'Produto Teste',
  description: null,
  price: '100.00' as any,
  stock: 0,
  status: 'ACTIVE' as any,
  createdAt: new Date(),
  updatedAt: new Date(),
  categories: [],
  ...overrides,
});

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockDeep<PrismaService>() },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get(PrismaService);
  });

  describe('create', () => {
    it('throws AppException when a categoryId does not exist', async () => {
      prisma.category.findMany.mockResolvedValueOnce([]);

      await expect(
        service.create({
          name: 'Test',
          price: 10,
          categoryIds: ['non-existent-uuid'],
        }, 'user-1'),
      ).rejects.toThrow(AppException);
    });

    it('creates a product when all categories exist', async () => {
      const cat = { id: 'cat-1' } as any;
      prisma.category.findMany.mockResolvedValueOnce([cat]);
      prisma.product.create.mockResolvedValueOnce(makeProduct() as any);

      const result = await service.create({
        name: 'Test',
        price: 100,
        categoryIds: ['cat-1'],
      }, 'user-1');

      expect(result).toBeDefined();
      expect(prisma.product.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when product does not exist', async () => {
      prisma.product.findUnique.mockResolvedValueOnce(null);
      await expect(service.findOne(9999)).rejects.toThrow(NotFoundException);
    });

    it('returns the product when found', async () => {
      prisma.product.findUnique.mockResolvedValueOnce(makeProduct() as any);
      const result = await service.findOne(1);
      expect(result).toBeDefined();
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when product does not exist', async () => {
      prisma.product.findUnique.mockResolvedValueOnce(null);
      await expect(service.remove(9999, 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('returns { deleted: true } on success', async () => {
      prisma.product.findUnique.mockResolvedValueOnce(makeProduct({ ownerId: 'user-1' }) as any);
      prisma.product.delete.mockResolvedValueOnce(makeProduct() as any);

      const result = await service.remove(1, 'user-1');
      expect(result).toEqual({ deleted: true });
    });

    it('throws AppException when requester is not the owner', async () => {
      prisma.product.findUnique.mockResolvedValueOnce(makeProduct({ ownerId: 'user-1' }) as any);

      await expect(service.remove(1, 'other-user')).rejects.toThrow(AppException);
    });
  });

  describe('findAll', () => {
    it('returns paginated results', async () => {
      prisma.$transaction.mockResolvedValueOnce([
        [makeProduct(), makeProduct()],
        2,
      ] as any);

      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });
});

