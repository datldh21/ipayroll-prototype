import { api } from './api';
import type { SocialInsurance } from '../types';

export const socialInsuranceService = {
  getByPeriod: async (year: number, month: number): Promise<SocialInsurance[]> => {
    const { data } = await api.get('/social-insurance', { params: { year, month } });
    return data.map((s: any) => ({
      id: s.id,
      employeeId: s.employeeId,
      month: s.month,
      year: s.year,
      baseSI: s.baseSI,
      bhxh: s.bhxh,
      bhyt: s.bhyt,
      bhtn: s.bhtn,
      siEmployee: s.siEmployee,
      bhxhEmployer: s.bhxhEmployer,
      bhytEmployer: s.bhytEmployer,
      bhtnEmployer: s.bhtnEmployer,
      siEmployer: s.siEmployer,
      unionFee: s.unionFee,
      isExempt: s.isExempt,
      note: s.note ?? '',
    }));
  },
  update: async (id: string, dto: Partial<SocialInsurance>): Promise<void> => {
    await api.patch(`/social-insurance/${id}`, dto);
  },
};
