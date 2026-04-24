import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { AppException } from '../common/exceptions/app.exception';
import { PrismaService } from '../prisma/prisma.service';
import { CategoriesService } from './categories.service';

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
      const catA = { id: 'A', name: 'A', description: null, parentId: null, createdAt: new Date(), updatedAt: new Date() };
      const catB = { id: 'B', name: 'B', description: null, parentId: 'A', createdAt: new Date(), updatedAt: new Date() };
      const catC = { id: 'C', name: 'C', description: null, parentId: 'B', createdAt: new Date(), updatedAt: new Date() };

      // findOne for existing check
      prisma.category.findUnique.mockResolvedValueOnce({
        ...catA,
        children: [],
        parent: null,
        products: [],
      } as any);

      // ensureParentExists → C exists
      prisma.category.findUnique.mockResolvedValueOnce(catC as any);

      // detectHierarchyLoop: walk from C → parentId=B → parentId=A === 'A' (categoryId)
      prisma.category.findUnique.mockResolvedValueOnce({ parentId: 'B' } as any);
      prisma.category.findUnique.mockResolvedValueOnce({ parentId: 'A' } as any);

      await expect(service.update('A', { parentId: 'C' })).rejects.toThrow(AppException);
    });

    it('does not throw when no loop exists', async () => {
      const catA = { id: 'A', name: 'A', description: null, parentId: null, createdAt: new Date(), updatedAt: new Date() };
      const catB = { id: 'B', name: 'B', description: null, parentId: null, createdAt: new Date(), updatedAt: new Date() };

      // findOne
      prisma.category.findUnique.mockResolvedValueOnce({
        ...catA,
        children: [],
        parent: null,
        products: [],
      } as any);

      // ensureParentExists → B exists
      prisma.category.findUnique.mockResolvedValueOnce(catB as any);

      // detectHierarchyLoop: B has no parent → no loop
      prisma.category.findUnique.mockResolvedValueOnce({ parentId: null } as any);

      // update call
      prisma.category.update.mockResolvedValueOnce({
        ...catA,
        parentId: 'B',
        children: [],
        parent: catB,
        products: [],
      } as any);

      await expect(service.update('A', { parentId: 'B' })).resolves.toBeDefined();
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
      const cat = { id: 'X', name: 'X', description: null, parentId: null, createdAt: new Date(), updatedAt: new Date() };
      prisma.category.findUnique.mockResolvedValueOnce({ ...cat, children: [], parent: null, products: [] } as any);
      prisma.category.delete.mockResolvedValueOnce(cat as any);

      const result = await service.remove('X');
      expect(result).toEqual({ deleted: true });
    });
  });
});
