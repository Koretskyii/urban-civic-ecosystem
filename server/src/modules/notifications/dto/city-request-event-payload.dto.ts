import { IsOptional, IsString } from 'class-validator';
import { BaseEventPayloadDto } from './base-event-payload.dto';

export class CityRequestEventPayloadDto extends BaseEventPayloadDto {
  @IsOptional()
  @IsString()
  requesterId?: string;

  @IsOptional()
  @IsString()
  requestId?: string;

  @IsOptional()
  @IsString()
  requestTitle?: string;

  @IsOptional()
  @IsString()
  departmentName?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  reportType?: string;

  @IsOptional()
  @IsString()
  messagePreview?: string;
}
