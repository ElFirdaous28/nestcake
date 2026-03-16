import { Injectable } from '@nestjs/common';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { UpdateProposalDto } from './dto/update-proposal.dto';

@Injectable()
export class ProposalsService {
  create(createProposalDto: CreateProposalDto) {
    return 'This action adds a new proposal';
  }

  findAll() {
    return `This action returns all proposals`;
  }

  findOne(id: string) {
    return `This action returns a #${id} proposal`;
  }

  update(id: string, updateProposalDto: UpdateProposalDto) {
    return `This action updates a #${id} proposal`;
  }

  remove(id: string) {
    return `This action removes a #${id} proposal`;
  }
}
