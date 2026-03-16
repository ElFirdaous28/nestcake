import { ProfessionalVerificationStatus } from '@shared-types';
import { IsEnum } from 'class-validator';

export class UpdateProfessionalVerificationDto {
  @IsEnum(ProfessionalVerificationStatus)
  verificationStatus: ProfessionalVerificationStatus;
}
