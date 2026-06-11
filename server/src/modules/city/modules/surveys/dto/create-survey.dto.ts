import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ResultsVisibility } from '@/generated/prisma/enums';

class SurveyOptionInputDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(500)
  text!: string;
}

export class CreateSurveyDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(10000)
  description?: string;

  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => SurveyOptionInputDto)
  options!: SurveyOptionInputDto[];

  @IsOptional()
  @IsDateString()
  closesAt?: string;

  @IsOptional()
  @IsEnum(ResultsVisibility)
  resultsVisibility?: ResultsVisibility;

  @IsOptional()
  @IsBoolean()
  allowVoteChange?: boolean;
}
