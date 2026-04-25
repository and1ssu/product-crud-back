import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AppException } from '../common/exceptions/app.exception';
import { buildPaginationMeta } from '../common/helpers/pagination.helper';
import { PrismaService } from '../prisma/prisma.service';
import { CategoryQueryDto } from './dto/category-query.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: CategoryQueryDto) {
    const { page = 1, limit = 10, name, parentId, ownerId } = query;

    const where: Prisma.CategoryWhereInput = {
      ...(name && { name: { contains: name, mode: 'insensitive' } }),
      ...(parentId !== undefined && { parentId }),
      ...(ownerId && { ownerId }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.category.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { children: true },
      }),
      this.prisma.category.count({ where }),
    ]);

    return { data, ...buildPaginationMeta(total, page, limit) };
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { children: true, parent: true },
    });
    if (!category) {
      throw new NotFoundException(`Category ${id} not found`);
    }
    return category;
  }

  async create(dto: CreateCategoryDto, ownerId: string) {
    if (dto.parentId) {
      await this.ensureParentExists(dto.parentId);
    }

    try {
      return await this.prisma.category.create({
        data: {
          name: dto.name,
          description: dto.description,
          parentId: dto.parentId,
          ownerId,
        },
        include: { children: true, parent: true },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new AppException(
          `Category name '${dto.name}' already exists`,
          HttpStatus.CONFLICT,
        );
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateCategoryDto, requesterId: string) {
    const existing = await this.findOne(id);
    this.assertOwner(existing.ownerId, requesterId);

    if (dto.parentId) {
      await this.ensureParentExists(dto.parentId);
      await this.detectHierarchyLoop(id, dto.parentId);
    }

    try {
      return await this.prisma.category.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.parentId !== undefined && { parentId: dto.parentId }),
        },
        include: { children: true, parent: true },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new AppException(
          `Category name '${dto.name}' already exists`,
          HttpStatus.CONFLICT,
        );
      }
      throw e;
    }
  }

  async remove(id: string, requesterId: string) {
    const existing = await this.findOne(id);
    this.assertOwner(existing.ownerId, requesterId);
    await this.prisma.category.delete({ where: { id } });
    return { deleted: true };
  }

  private assertOwner(ownerId: string | null, requesterId: string): void {
    if (ownerId !== requesterId) {
      throw new AppException(
        'Você não tem permissão para modificar esta categoria',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private async ensureParentExists(parentId: string): Promise<void> {
    const parent = await this.prisma.category.findUnique({ where: { id: parentId } });
    if (!parent) {
      throw new NotFoundException(`Parent category ${parentId} not found`);
    }
  }

  private async detectHierarchyLoop(categoryId: string, newParentId: string): Promise<void> {
    let currentId: string | null = newParentId;

    while (currentId !== null) {
      if (currentId === categoryId) {
        throw new AppException(
          'Circular hierarchy detected: a category cannot be its own ancestor',
          HttpStatus.BAD_REQUEST,
        );
      }

      const row: { parentId: string | null } | null =
        await this.prisma.category.findUnique({
          where: { id: currentId },
          select: { parentId: true },
        });

      currentId = row?.parentId ?? null;
    }
  }
}
