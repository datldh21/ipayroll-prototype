import { api } from './api';
import type { VariableIncome } from '../types';

export const variableIncomesService = {
  getByPeriod: async (year: number, month: number): Promise<VariableIncome[]> => {
    const { data } = await api.get('/variable-incomes', { params: { year, month } });
    return data.map((v: any) => ({
      id: v.id,
      employeeId: v.employeeId,
      month: v.month,
      year: v.year,
      commission: v.commission,
      commissionDetail: v.commissionDetail ?? '',
      bonus: v.bonus,
      bonusDetail: v.bonusDetail ?? '',
      otherIncome: v.otherIncome,
      otherIncomeDetail: v.otherIncomeDetail ?? '',
      otherAllowance: v.otherAllowance,
      otherAllowanceDetail: v.otherAllowanceDetail ?? '',
    }));
  },
  update: async (id: string, dto: Partial<VariableIncome>): Promise<void> => {
    await api.patch(`/variable-incomes/${id}`, dto);
  },
};
