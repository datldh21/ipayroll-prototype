import { api } from './api';
import type { Employee } from '../types';

export const employeesService = {
  getAll: async (): Promise<Employee[]> => {
    const { data } = await api.get('/employees');
    return data.map((e: any) => ({
      id: e.employeeCode ?? e.id,
      fullName: e.fullName,
      email: e.email,
      phone: e.phone ?? '',
      bankAccount: e.bankAccount ?? '',
      bankName: e.bankName ?? '',
      department: e.department ?? '',
      position: e.position ?? '',
      level: e.level ?? '',
      orgLevel1: e.orgLevel1 ?? '',
      orgLevel2: e.orgLevel2 ?? '',
      orgLevel3: e.orgLevel3 ?? '',
      orgLevel4: e.orgLevel4 ?? '',
      orgLevel5: e.orgLevel5 ?? '',
      status: e.status,
      onboardDate: e.onboardDate ?? '',
      officialDate: e.officialDate ?? '',
      lastWorkingDate: e.lastWorkingDate ?? '',
      dependents: e.dependents ?? 0,
      baseSalary: e.baseSalary ?? 0,
      costAccount: e.costAccount ?? '',
    }));
  },
};
