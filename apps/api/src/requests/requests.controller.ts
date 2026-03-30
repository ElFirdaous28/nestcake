import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { multerDiskConfig } from '../common/upload.config';
import { AuthUser, RequestStatus, UserRole } from '@shared-types';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('requests')
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create request (client only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title', 'description', 'deliveryDateTime', 'deliveryType'],
      properties: {
        title: { type: 'string', example: 'Birthday cake for 20 guests' },
        description: {
          type: 'string',
          example: 'Need a custom chocolate cake with floral design.',
        },
        eventType: { type: 'string', example: 'Birthday' },
        budget: { type: 'number', example: 180 },
        deliveryDateTime: {
          type: 'string',
          format: 'date-time',
          example: '2026-08-01T15:30:00.000Z',
        },
        deliveryType: { type: 'string', example: 'DELIVERY' },
        location: { type: 'string', example: '123 Main St, New York, NY' },
        allergyIds: {
          type: 'array',
          items: { type: 'string', example: '65f0c7e8f9697f3c69312345' },
        },
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @UseInterceptors(FileInterceptor('image', multerDiskConfig('requests')))
  @Post()
  create(
    @Req() req: Request & { user: AuthUser },
    @Body() createRequestDto: CreateRequestDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.requestsService.create(req.user, createRequestDto, file);
  }

  @ApiOperation({ summary: 'List requests' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'search', required: false, example: 'chocolate' })
  @Get()
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('search') search: string = '',
  ) {
    return this.requestsService.findAll(page, limit, search);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'List current client requests' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @Get('my-requests')
  findMyRequests(
    @Req() req: Request & { user: AuthUser },
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.requestsService.findMyRequests(req.user, page, limit);
  }

  @ApiOperation({ summary: 'Get request by id' })
  @ApiParam({ name: 'id', example: '65f0c7e8f9697f3c69312345' })
  @Get(':id')
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.requestsService.findOne(id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update request (client only)' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', example: '65f0c7e8f9697f3c69312345' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Updated birthday cake request' },
        description: {
          type: 'string',
          example: 'Updated details for flavor and design requirements.',
        },
        eventType: { type: 'string', example: 'Birthday' },
        budget: { type: 'number', example: 220 },
        deliveryDateTime: {
          type: 'string',
          format: 'date-time',
          example: '2026-08-03T16:00:00.000Z',
        },
        deliveryType: { type: 'string', example: 'PICKUP' },
        location: { type: 'string', example: '123 Main St, New York, NY' },
        allergyIds: {
          type: 'array',
          items: { type: 'string', example: '65f0c7e8f9697f3c69312345' },
        },
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @UseInterceptors(FileInterceptor('image', multerDiskConfig('requests')))
  @Patch(':id')
  update(
    @Req() req: Request & { user: AuthUser },
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateRequestDto: UpdateRequestDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.requestsService.update(id, req.user, updateRequestDto, file);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete request (client only)' })
  @ApiParam({ name: 'id', example: '65f0c7e8f9697f3c69312345' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @Delete(':id')
  remove(@Req() req: Request & { user: AuthUser }, @Param('id', ParseObjectIdPipe) id: string) {
    return this.requestsService.remove(id, req.user);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update request status (client only)' })
  @ApiParam({ name: 'id', example: '65f0c7e8f9697f3c69312345' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['status'],
      properties: {
        status: { type: 'string', example: 'OPEN' },
      },
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @Patch(':id/status')
  updateStatus(
    @Req() req: Request & { user: AuthUser },
    @Param('id', ParseObjectIdPipe) id: string,
    @Body('status') status: RequestStatus,
  ) {
    return this.requestsService.updateStatus(id, req.user, status);
  }
}
