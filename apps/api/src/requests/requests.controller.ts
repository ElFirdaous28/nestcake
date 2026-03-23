import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Req, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
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

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

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

  @Get()
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('search') search: string = '',
  ) {
    return this.requestsService.findAll(page, limit, search);
  }

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

  @Get(':id')
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.requestsService.findOne(id);
  }

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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @Delete(':id')
  remove(@Req() req: Request & { user: AuthUser }, @Param('id', ParseObjectIdPipe) id: string) {
    return this.requestsService.remove(id, req.user);
  }

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
