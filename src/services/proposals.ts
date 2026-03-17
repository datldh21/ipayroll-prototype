import { api } from './api';
import type { Proposal, ProposalStatus } from '../types';

export const proposalsService = {
  getAll: async (): Promise<Proposal[]> => {
    const { data } = await api.get('/proposals');
    return data;
  },
  create: async (
    dto: Omit<Proposal, 'id' | 'createdAt' | 'status'>,
  ): Promise<Proposal> => {
    const { data } = await api.post('/proposals', {
      employeeId: dto.employeeId,
      type: dto.type,
      month: dto.month,
      year: dto.year,
      subject: dto.subject,
      description: dto.description,
    });
    return data;
  },
  respond: async (
    id: string,
    status: ProposalStatus,
    response: string,
    respondedBy: string,
  ): Promise<void> => {
    await api.patch(`/proposals/${id}/respond`, {
      status,
      response,
      respondedBy,
    });
  },
};
