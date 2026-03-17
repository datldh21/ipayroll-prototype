import { api } from './api';
import type { Timekeeping } from '../types';

export const timekeepingService = {
  getByPeriod: async (year: number, month: number): Promise<Timekeeping[]> => {
    const { data } = await api.get('/timekeeping', { params: { year, month } });
    return data.map((t: any) => ({
      id: t.id,
      employeeId: t.employeeId,
      month: t.month,
      year: t.year,
      standardDays: t.standardDays,
      actualDays: t.actualDays,
      probationDays: t.probationDays,
      officialDays: t.officialDays,
      remainingLeave: t.remainingLeave,
      unpaidLeave: t.unpaidLeave,
      unpaidLeaveProbation: t.unpaidLeaveProbation,
      unpaidLeaveOfficial: t.unpaidLeaveOfficial,
    }));
  },
  update: async (id: string, dto: Partial<Timekeeping>): Promise<void> => {
    await api.patch(`/timekeeping/${id}`, dto);
  },
};
