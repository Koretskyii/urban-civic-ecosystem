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
import { ROLES } from '@/modules/rbac/constants/roles.const';

export const CITY_MEMBER_SORT_FIELDS = ['name', 'email', 'joinedAt'] as const;
export const CITY_MEMBER_SORT_ORDERS = ['asc', 'desc'] as const;
export const CITY_MEMBER_ROLES = [
  ROLES.ADMIN,
  ROLES.MUNICIPALITY,
  ROLES.ORGANIZER,
  ROLES.CITIZEN,
] as const;

export class GetCityMembersQueryDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsIn(CITY_MEMBER_ROLES)
  role?: (typeof CITY_MEMBER_ROLES)[number];

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

  @IsOptional()
  @IsIn(CITY_MEMBER_SORT_FIELDS)
  sortBy?: (typeof CITY_MEMBER_SORT_FIELDS)[number];

  @IsOptional()
  @IsIn(CITY_MEMBER_SORT_ORDERS)
  sortOrder?: (typeof CITY_MEMBER_SORT_ORDERS)[number];
}
