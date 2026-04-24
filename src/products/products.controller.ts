import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

interface AuthRequest extends Request {
  user: { userId: string; email: string };
}

@ApiTags('product')
@Controller('product')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @ApiOperation({ summary: 'List products with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated product list' })
  @Get()
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, description: 'Product found' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created' })
  @ApiResponse({ status: 400, description: 'Invalid category IDs or price < 0' })
  @ApiResponse({ status: 409, description: 'Product name already exists' })
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateProductDto, @Req() req: AuthRequest) {
    return this.productsService.create(dto, req.user.userId);
  }

  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Partially update a product (owner only)' })
  @ApiResponse({ status: 200, description: 'Product updated' })
  @ApiResponse({ status: 403, description: 'Not the product owner' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
    @Req() req: AuthRequest,
  ) {
    return this.productsService.update(id, dto, req.user.userId);
  }

  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Delete a product (owner only)' })
  @ApiResponse({ status: 200, description: 'Product deleted' })
  @ApiResponse({ status: 403, description: 'Not the product owner' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.productsService.remove(id, req.user.userId);
  }
}
