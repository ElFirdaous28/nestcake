import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsDate,
  MinLength,
  MaxLength,
  Min,
  IsEnum,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DeliveryType } from '@shared-types';

export class CreateRequestDto {
  @IsString()
  @MinLength(5)
  @MaxLength(100)
  title: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description: string;

  @IsOptional()
  @IsString()
  eventType?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number;

  @IsDate()
  @Type(() => Date)
  deliveryDateTime: Date;

  @IsEnum(DeliveryType)
  deliveryType: DeliveryType;

  @ValidateIf((dto) => dto.deliveryType === DeliveryType.DELIVERY)
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  location?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergyIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}
