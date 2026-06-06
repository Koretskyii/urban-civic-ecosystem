import { Transform } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { CityCreationRequestStatus } from '@/generated/prisma/enums';

const CITY_CREATION_REQUEST_STATUSES = Object.values(CityCreationRequestStatus);

export class GetCityCreationRequestsQueryDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsIn(CITY_CREATION_REQUEST_STATUSES)
  status?: CityCreationRequestStatus;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => Number(value))
  @IsInt()
  @Min(1)
  page?: number;
}
