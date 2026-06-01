import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { AlertSeverity } from '@/generated/prisma/enums';

export class CreateAlertDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  alertTypeId!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(10000)
  content!: string;

  @Transform(({ value }: { value: unknown }) => {
    if (value === undefined || value === null || value === '') {
      return AlertSeverity.MEDIUM;
    }
    if (typeof value === 'string') {
      return value.trim().toUpperCase();
    }
    return value;
  })
  @IsEnum(AlertSeverity)
  severity: AlertSeverity = AlertSeverity.MEDIUM;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
