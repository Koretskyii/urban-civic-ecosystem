import { IsEnum } from 'class-validator';
import { RequestStatus } from '@/generated/prisma/enums';

export class UpdateCityRequestStatusDto {
  @IsEnum(RequestStatus)
  status!: RequestStatus;
}
