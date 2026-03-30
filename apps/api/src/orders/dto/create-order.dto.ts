import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsInt, IsMongoId, Min, ValidateNested } from 'class-validator';

class CreateOrderItemDto {
  @IsMongoId()
  productId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
