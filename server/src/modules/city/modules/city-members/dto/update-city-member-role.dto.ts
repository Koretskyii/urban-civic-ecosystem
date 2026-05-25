import { IsIn, IsString } from 'class-validator';
import { ROLES } from '@/modules/rbac/constants/roles.const';

const ROLE_VALUES = Object.values(ROLES);

export class UpdateCityMemberRoleDto {
  @IsString()
  @IsIn(ROLE_VALUES)
  role!: (typeof ROLE_VALUES)[number];
}
