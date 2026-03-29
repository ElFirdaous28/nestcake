import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { UserRole } from '@shared-types';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create category (admin only)' })
  @ApiBody({
    type: CreateCategoryDto,
    examples: {
      default: { value: { name: 'Birthday Cakes' } },
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @ApiOperation({ summary: 'List categories' })
  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @ApiOperation({ summary: 'Get category by id' })
  @ApiParam({ name: 'id', example: '65f0c7e8f9697f3c69312345' })
  @Get(':id')
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.categoriesService.findOne(id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update category (admin only)' })
  @ApiParam({ name: 'id', example: '65f0c7e8f9697f3c69312345' })
  @ApiBody({
    type: UpdateCategoryDto,
    examples: {
      default: { value: { name: 'Wedding Cakes' } },
    },
  })
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete category (admin only)' })
  @ApiParam({ name: 'id', example: '65f0c7e8f9697f3c69312345' })
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.categoriesService.remove(id);
  }
}
