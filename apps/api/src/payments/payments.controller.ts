import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @ApiOperation({ summary: 'Create payment' })
  @ApiBody({
    type: CreatePaymentDto,
    examples: {
      default: {
        value: {
          orderId: '65f0c7e8f9697f3c69312345',
          amount: 59.99,
          provider: 'stripe',
        },
      },
    },
  })
  @Post()
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(createPaymentDto);
  }

  @ApiOperation({ summary: 'List payments' })
  @Get()
  findAll() {
    return this.paymentsService.findAll();
  }

  @ApiOperation({ summary: 'Get payment by id' })
  @ApiParam({ name: 'id', example: '65f0c7e8f9697f3c69312345' })
  @Get(':id')
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.paymentsService.findOne(id);
  }

  @ApiOperation({ summary: 'Update payment' })
  @ApiParam({ name: 'id', example: '65f0c7e8f9697f3c69312345' })
  @ApiBody({
    type: UpdatePaymentDto,
    examples: {
      default: {
        value: {
          status: 'PAID',
        },
      },
    },
  })
  @Patch(':id')
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
    return this.paymentsService.update(id, updatePaymentDto);
  }

  @ApiOperation({ summary: 'Delete payment' })
  @ApiParam({ name: 'id', example: '65f0c7e8f9697f3c69312345' })
  @Delete(':id')
  remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.paymentsService.remove(id);
  }
}
