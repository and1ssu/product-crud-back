import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';
import { AppException } from '../common/exceptions/app.exception';
import { buildPaginationMeta } from '../common/helpers/pagination.helper';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';

const productInclude = {
  categories: {
    include: { category: true },
  },
} satisfies Prisma.ProductInclude;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductDto, ownerId: string) {
    await this.validateCategories(dto.categoryIds);

    try {
      return await this.prisma.product.create({
        data: {
          name: dto.name,
          description: dto.description,
          price: new Prisma.Decimal(dto.price),
          stock: dto.stock ?? 0,
          status: dto.status ?? ProductStatus.ACTIVE,
          ownerId,
          categories: {
            create: dto.categoryIds.map((categoryId) => ({ categoryId })),
          },
        },
        include: productInclude,
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new AppException(
          `Product name '${dto.name}' already exists`,
          HttpStatus.CONFLICT,
        );
      }
      throw e;
    }
  }

  async findAll(query: ProductQueryDto) {
    const { page = 1, limit = 10, name, categoryId, status, order = 'desc' } = query;

    const where: Prisma.ProductWhereInput = {
      ...(name && { name: { contains: name, mode: 'insensitive' } }),
      ...(status && { status }),
      ...(categoryId && { categories: { some: { categoryId } } }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: order },
        include: productInclude,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { data, ...buildPaginationMeta(total, page, limit) };
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: productInclude,
    });

    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    return product;
  }

  async update(id: number, dto: UpdateProductDto, requesterId: string) {
    const product = await this.findOne(id);
    this.assertOwner(product.ownerId, requesterId);

    if (dto.categoryIds !== undefined) {
      await this.validateCategories(dto.categoryIds);
    }

    try {
      return await this.prisma.product.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.price !== undefined && { price: new Prisma.Decimal(dto.price) }),
          ...(dto.stock !== undefined && { stock: dto.stock }),
          ...(dto.status !== undefined && { status: dto.status }),
          ...(dto.categoryIds !== undefined && {
            categories: {
              deleteMany: {},
              create: dto.categoryIds.map((categoryId) => ({ categoryId })),
            },
          }),
        },
        include: productInclude,
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new AppException(
          `Product name '${dto.name}' already exists`,
          HttpStatus.CONFLICT,
        );
      }
      throw e;
    }
  }

  async remove(id: number, requesterId: string) {
    const product = await this.findOne(id);
    this.assertOwner(product.ownerId, requesterId);
    await this.prisma.product.delete({ where: { id } });
    return { deleted: true };
  }

  private assertOwner(ownerId: string | null, requesterId: string): void {
    if (ownerId !== requesterId) {
      throw new AppException(
        'You do not have permission to modify this product',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private async validateCategories(categoryIds: string[]): Promise<void> {
    const found = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true },
    });

    if (found.length !== categoryIds.length) {
      throw new AppException(
        'One or more category IDs are invalid',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
