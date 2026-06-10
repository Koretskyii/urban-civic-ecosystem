import { IsISO8601, IsOptional, IsString } from 'class-validator';

export class CityRequestEventPayloadDto {
  @IsString()
  eventId!: string;

  @IsISO8601()
  occurredAt!: string;

  @IsString()
  cityId!: string;

  @IsString()
  aggregateId!: string;

  @IsString()
  actorId!: string;

  @IsString()
  requesterId!: string;

  @IsString()
  title!: string;

  @IsString()
  requestId!: string;

  @IsString()
  requestTitle!: string;

  @IsOptional()
  @IsString()
  status!: string | null;

  @IsOptional()
  @IsString()
  departmentId!: string | null;

  @IsOptional()
  @IsString()
  departmentName!: string | null;

  @IsOptional()
  @IsString()
  reportId!: string | null;

  @IsOptional()
  @IsString()
  reportType!: string | null;

  @IsOptional()
  @IsString()
  messageId!: string | null;

  @IsOptional()
  @IsString()
  messagePreview!: string | null;
}
