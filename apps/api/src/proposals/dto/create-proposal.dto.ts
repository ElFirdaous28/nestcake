import { Type } from 'class-transformer';
import { IsDate, IsMongoId, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateProposalDto {
  @IsMongoId()
  requestId: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  deliveryDateTime?: Date;
}
