import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { RequestStatus } from '@/generated/prisma/enums';

export enum CityRequestScope {
  ALL = 'all',
  MINE = 'mine',
}

export class GetCityRequestsQueryDto {
  @IsOptional()
  @IsEnum(CityRequestScope)
  scope?: CityRequestScope;

  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  departmentId?: string;
}
