import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { RequestStatus } from '@/generated/prisma/enums';

export enum CityRequestScope {
  ALL = 'all',
  MINE = 'mine',
}

export const CITY_REQUEST_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'priority',
  'status',
] as const;
export const SORT_ORDERS = ['asc', 'desc'] as const;

export class GetCityRequestsQueryDto {
  @IsOptional()
  @IsEnum(CityRequestScope)
  scope?: CityRequestScope;

  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  departmentId?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => Number(value))
  @IsInt()
  @Min(0)
  priority?: number;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsIn(CITY_REQUEST_SORT_FIELDS)
  sortBy?: (typeof CITY_REQUEST_SORT_FIELDS)[number];

  @IsOptional()
  @IsIn(SORT_ORDERS)
  sortOrder?: (typeof SORT_ORDERS)[number];
}
