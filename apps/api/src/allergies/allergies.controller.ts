import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AllergiesService } from './allergies.service';
import { CreateAllergyDto } from './dto/create-allergy.dto';
import { UpdateAllergyDto } from './dto/update-allergy.dto';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { UserRole } from '@shared-types';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

@ApiTags('allergies')
@Controller('allergies')
export class AllergiesController {
  constructor(private readonly allergiesService: AllergiesService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create allergy (admin only)' })
  @ApiBody({
    type: CreateAllergyDto,
    examples: {
      default: { value: { name: 'Peanut' } },
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() createAllergyDto: CreateAllergyDto) {
    return this.allergiesService.create(createAllergyDto);
  }

  @ApiOperation({ summary: 'List allergies' })
  @Get()
  findAll() {
    return this.allergiesService.findAll();
  }

  @ApiOperation({ summary: 'Get allergy by id' })
  @ApiParam({ name: 'id', example: '65f0c7e8f9697f3c69312345' })
  @Get(':id')
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.allergiesService.findOne(id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update allergy (admin only)' })
  @ApiParam({ name: 'id', example: '65f0c7e8f9697f3c69312345' })
  @ApiBody({
    type: UpdateAllergyDto,
    examples: {
      default: { value: { name: 'Dairy' } },
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() updateAllergyDto: UpdateAllergyDto) {
    return this.allergiesService.update(id, updateAllergyDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete allergy (admin only)' })
  @ApiParam({ name: 'id', example: '65f0c7e8f9697f3c69312345' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.allergiesService.remove(id);
  }
}
