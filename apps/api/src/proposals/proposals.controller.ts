import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthUser, UserRole } from '@shared-types';
import { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { ProposalsService } from './proposals.service';
import { CreateProposalDto } from './dto/create-proposal.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('proposals')
@Controller('proposals')
export class ProposalsController {
  constructor(private readonly proposalsService: ProposalsService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create proposal (professional only)' })
  @ApiBody({
    type: CreateProposalDto,
    examples: {
      default: {
        value: {
          requestId: '65f0c7e8f9697f3c69312345',
          price: 149.99,
          message: 'I can deliver a custom 2-tier cake for your event.',
          deliveryDateTime: '2026-06-30T14:00:00.000Z',
        },
      },
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESSIONAL)
  @Post()
  create(
    @Req() req: Request & { user: AuthUser },
    @Body() createProposalDto: CreateProposalDto,
  ) {
    return this.proposalsService.create(req.user, createProposalDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all proposals (admin)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  findAllForAdmin() {
    return this.proposalsService.findAllForAdmin();
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'List my proposals (professional)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESSIONAL)
  @Get('my')
  findMy(@Req() req: Request & { user: AuthUser }) {
    return this.proposalsService.findMy(req.user);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'List proposals by request id (client/admin)' })
  @ApiParam({ name: 'requestId', example: '65f0c7e8f9697f3c69312345' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @Get('request/:requestId')
  findByRequest(
    @Req() req: Request & { user: AuthUser },
    @Param('requestId', ParseObjectIdPipe) requestId: string,
  ) {
    return this.proposalsService.findByRequest(req.user, requestId);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept proposal (client only)' })
  @ApiParam({ name: 'id', example: '65f0c7e8f9697f3c69312345' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @Patch(':id/accept')
  accept(
    @Req() req: Request & { user: AuthUser },
    @Param('id', ParseObjectIdPipe) id: string,
  ) {
    return this.proposalsService.accept(req.user, id);
  }
}
