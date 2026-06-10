import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateCityRequestDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  @Max(5)
  priority?: number;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  locationLat!: number;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  locationLng!: number;

  @IsOptional()
  @IsString()
  address?: string;
}
