import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class FindProductsQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @IsOptional()
  @IsString()
  search = '';
}
