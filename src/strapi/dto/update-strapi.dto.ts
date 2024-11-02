import { PartialType } from '@nestjs/mapped-types';
import { CreateStrapiDto } from './create-strapi.dto';

export class UpdateStrapiDto extends PartialType(CreateStrapiDto) {}
