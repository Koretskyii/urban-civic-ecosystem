import { IsNotEmpty, IsString } from 'class-validator';

export class AssignCityRequestDto {
  @IsString()
  @IsNotEmpty()
  departmentId!: string;
}
