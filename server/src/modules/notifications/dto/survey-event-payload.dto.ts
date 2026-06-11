import { IsOptional, IsString } from 'class-validator';
import { BaseEventPayloadDto } from './base-event-payload.dto';

export class SurveyEventPayloadDto extends BaseEventPayloadDto {
  @IsOptional()
  @IsString()
  closesAt!: string | null;
}
