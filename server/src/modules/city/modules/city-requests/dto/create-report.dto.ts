import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ReportType, RequestStatus } from '@/generated/prisma/enums';

export class CreateReportDto {
  @IsEnum(ReportType)
  type!: ReportType;

  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  @IsOptional()
  @IsString()
  description?: string;
}
