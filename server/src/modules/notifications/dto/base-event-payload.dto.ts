import { IsISO8601, IsNotEmpty, IsString } from 'class-validator';

export class BaseEventPayloadDto {
  @IsString()
  @IsNotEmpty()
  eventId!: string;

  @IsISO8601()
  occuredAt!: string;

  @IsString()
  @IsNotEmpty()
  cityId!: string;

  @IsString()
  @IsNotEmpty()
  agregateId!: string;

  @IsString()
  @IsNotEmpty()
  publisherId!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;
}
