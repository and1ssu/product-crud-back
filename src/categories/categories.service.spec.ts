import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Category, Prisma } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { AppException } from '../common/exceptions/app.exception';
import { PrismaService } from '../prisma/prisma.service';
import { CategoriesService } from './categories.service';
type CategoryWithRelations = Prisma.CategoryGetPayload<{
  include: { children: true; parent: true };
}>;


const makeCategory = (overrides: Partial<Category> = {}): Category => ({
  id: 'category-id',
  name: 'Category',
  description: null,
  parentId: null,
  ownerId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const makeCategoryWithRelations = (
  overrides: Partial<CategoryWithRelations> = {},
): CategoryWithRelations => ({
  ...makeCategory(),
  children: [],
  parent: null,
  ...overrides,
});

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: mockDeep<PrismaService>() },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    prisma = module.get(PrismaService);
  });

  describe('detectHierarchyLoop (via update)', () => {
    it('throws AppException when category is in its own ancestor chain', async () => {
      const catA = makeCategory({ id: 'A', name: 'A', ownerId: 'user-1' });
      const catC = makeCategory({ id: 'C', name: 'C', parentId: 'B' });

      // findOne for existing check
      prisma.category.findUnique.mockResolvedValueOnce(makeCategoryWithRelations({
        ...catA,
      }));

      // ensureParentExists → C exists
      prisma.category.findUnique.mockResolvedValueOnce(catC);

      // detectHierarchyLoop: walk from C → parentId=B → parentId=A === 'A' (categoryId)
      prisma.category.findUnique.mockResolvedValueOnce(makeCategory({ id: 'B', parentId: 'A' }));
      prisma.category.findUnique.mockResolvedValueOnce(makeCategory({ id: 'A', parentId: null }));

      await expect(service.update('A', { parentId: 'C' }, 'user-1')).rejects.toThrow(AppException);
    });

    it('does not throw when no loop exists', async () => {
      const catA = makeCategory({ id: 'A', name: 'A', ownerId: 'user-1' });
      const catB = makeCategory({ id: 'B', name: 'B' });

      // findOne
      prisma.category.findUnique.mockResolvedValueOnce(makeCategoryWithRelations({
        ...catA,
      }));

      // ensureParentExists → B exists
      prisma.category.findUnique.mockResolvedValueOnce(catB);

      // detectHierarchyLoop: B has no parent → no loop
      prisma.category.findUnique.mockResolvedValueOnce(makeCategory({ id: 'B', parentId: null }));

      // update call
      prisma.category.update.mockResolvedValueOnce(makeCategoryWithRelations({
        ...catA,
        parentId: 'B',
        parent: catB,
      }));

      await expect(service.update('A', { parentId: 'B' }, 'user-1')).resolves.toBeDefined();
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when category does not exist', async () => {
      prisma.category.findUnique.mockResolvedValueOnce(null);
      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('returns { deleted: true } on successful deletion', async () => {
      const cat = makeCategory({ id: 'X', name: 'X', ownerId: 'user-1' });
      prisma.category.findUnique.mockResolvedValueOnce(makeCategoryWithRelations({
        ...cat,
      }));
      prisma.category.delete.mockResolvedValueOnce(cat);

      const result = await service.remove('X', 'user-1');
      expect(result).toEqual({ deleted: true });
    });
  });
});
