import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AlertSeverity } from '@/generated/prisma/client';
import { BaseEventPayloadDto } from './base-event-payload.dto';

export class AlertEventPayloadDto extends BaseEventPayloadDto {
  @IsString()
  alertTypeId!: string;

  @IsEnum(AlertSeverity)
  severity!: AlertSeverity;

  @IsOptional()
  @IsString()
  expiresAt!: string | null;
}
