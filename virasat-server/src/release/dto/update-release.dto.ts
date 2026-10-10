import { PartialType } from '@nestjs/mapped-types';
import { CreateReleaseCaseDto } from './create-release-case.dto';

export class UpdateReleaseDto extends PartialType(CreateReleaseCaseDto) {}
