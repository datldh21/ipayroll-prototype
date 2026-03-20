import { api } from './api';
import type { Employee } from '../types';

function mapFromApi(e: any): Employee {
  return {
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
    lunchAllowance: e.lunchAllowance ?? e.lunch ?? undefined,
    phoneAllowance: e.phoneAllowance ?? undefined,
  };
}

function toApiPayload(emp: Employee): Record<string, unknown> {
  return {
    employeeCode: emp.id,
    fullName: emp.fullName,
    email: emp.email,
    phone: emp.phone,
    bankAccount: emp.bankAccount,
    bankName: emp.bankName,
    department: emp.department,
    position: emp.position,
    level: emp.level,
    orgLevel1: emp.orgLevel1,
    orgLevel2: emp.orgLevel2,
    orgLevel3: emp.orgLevel3,
    orgLevel4: emp.orgLevel4,
    orgLevel5: emp.orgLevel5,
    status: emp.status,
    onboardDate: emp.onboardDate || undefined,
    officialDate: emp.officialDate || undefined,
    lastWorkingDate: emp.lastWorkingDate || undefined,
    dependents: emp.dependents,
    baseSalary: emp.baseSalary,
    costAccount: emp.costAccount,
    lunchAllowance: emp.lunchAllowance,
    phoneAllowance: emp.phoneAllowance,
  };
}

export const employeesService = {
  getAll: async (): Promise<Employee[]> => {
    const { data } = await api.get('/employees');
    return data.map((e: any) => mapFromApi(e));
  },
  create: async (emp: Employee): Promise<Employee> => {
    const { data } = await api.post('/employees', toApiPayload(emp));
    return mapFromApi(data);
  },
  update: async (id: string, emp: Partial<Employee>): Promise<Employee> => {
    const payload = toApiPayload({ ...emp, id } as Employee);
    const { data } = await api.patch(`/employees/${id}`, payload);
    return mapFromApi(data);
  },
};
