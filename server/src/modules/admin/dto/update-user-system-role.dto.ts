import { IsIn } from 'class-validator';
import { SystemRole } from '@/generated/prisma/enums';

const SYSTEM_ROLES = Object.values(SystemRole);

export class UpdateUserSystemRoleDto {
  @IsIn(SYSTEM_ROLES)
  systemRole!: SystemRole;
}
