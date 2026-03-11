import { Injectable } from '@nestjs/common';
import { CreateAllergyDto } from './dto/create-allergy.dto';
import { UpdateAllergyDto } from './dto/update-allergy.dto';

@Injectable()
export class AllergiesService {
  create(createAllergyDto: CreateAllergyDto) {
    return 'This action adds a new allergy';
  }

  findAll() {
    return `This action returns all allergies`;
  }

  findOne(id: number) {
    return `This action returns a #${id} allergy`;
  }

  update(id: number, updateAllergyDto: UpdateAllergyDto) {
    return `This action updates a #${id} allergy`;
  }

  remove(id: number) {
    return `This action removes a #${id} allergy`;
  }
}
