import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  Employee,
  Timekeeping,
  SocialInsurance,
  VariableIncome,
  GrossPackage,
  PayrollBatch,
  PayrollRecord,
  User,
} from '../types';
import {
  mockEmployees,
  mockTimekeeping,
  mockSocialInsurance,
  mockVariableIncomes,
  mockPayrollBatches,
  defaultGrossPackage,
  employeePackageOverrides,
} from '../data/mockData';
import { calculatePayrollRecord } from '../utils/payrollCalculator';

interface AppContextType {
  currentUser: User;
  switchUser: () => void;
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  timekeeping: Timekeeping[];
  setTimekeeping: React.Dispatch<React.SetStateAction<Timekeeping[]>>;
  socialInsurance: SocialInsurance[];
  setSocialInsurance: React.Dispatch<React.SetStateAction<SocialInsurance[]>>;
  variableIncomes: VariableIncome[];
  setVariableIncomes: React.Dispatch<React.SetStateAction<VariableIncome[]>>;
  grossPackage: GrossPackage;
  setGrossPackage: React.Dispatch<React.SetStateAction<GrossPackage>>;
  packageOverrides: Record<string, Partial<GrossPackage>>;
  setPackageOverrides: React.Dispatch<React.SetStateAction<Record<string, Partial<GrossPackage>>>>;
  payrollBatches: PayrollBatch[];
  setPayrollBatches: React.Dispatch<React.SetStateAction<PayrollBatch[]>>;
  generatePayroll: (month: number, year: number) => PayrollBatch;
  approveBatch: (batchId: string) => void;
  emailsSent: Record<string, boolean>;
  setEmailsSent: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

const users: User[] = [
  { id: 'U001', name: 'Nguyễn Thị Hiền', role: 'cb_specialist' },
  { id: 'U002', name: 'Trần Thị Nguyệt', role: 'manager' },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUserIdx, setCurrentUserIdx] = useState(0);
  const currentUser = users[currentUserIdx];
  const switchUser = () => setCurrentUserIdx((i) => (i + 1) % users.length);

  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [timekeeping, setTimekeeping] = useState<Timekeeping[]>(mockTimekeeping);
  const [socialInsurance, setSocialInsurance] = useState<SocialInsurance[]>(mockSocialInsurance);
  const [variableIncomes, setVariableIncomes] = useState<VariableIncome[]>(mockVariableIncomes);
  const [grossPackage, setGrossPackage] = useState<GrossPackage>(defaultGrossPackage);
  const [packageOverrides, setPackageOverrides] = useState<Record<string, Partial<GrossPackage>>>(employeePackageOverrides);
  const [payrollBatches, setPayrollBatches] = useState<PayrollBatch[]>(mockPayrollBatches);
  const [emailsSent, setEmailsSent] = useState<Record<string, boolean>>({});

  const generatePayroll = useCallback((month: number, year: number): PayrollBatch => {
    const records: PayrollRecord[] = employees.map((emp) => {
      const tk = timekeeping.find((t) => t.employeeId === emp.id && t.month === month && t.year === year)
        || { employeeId: emp.id, month, year, standardDays: 20, actualDays: 20, probationDays: 0, officialDays: 20, remainingLeave: 0, unpaidLeave: 0 };
      const si = socialInsurance.find((s) => s.employeeId === emp.id && s.month === month && s.year === year)
        || { employeeId: emp.id, month, year, baseSI: 0, bhxh: 0, bhyt: 0, bhtn: 0, siEmployee: 0, bhxhEmployer: 0, bhytEmployer: 0, bhtnEmployer: 0, siEmployer: 0, unionFee: 0, isExempt: false, note: '' };
      const vi = variableIncomes.find((v) => v.employeeId === emp.id && v.month === month && v.year === year)
        || { employeeId: emp.id, month, year, commission: 0, bonus: 0, otherIncome: 0, otherAllowance: 0 };

      // Tạo gói thu nhập cho NV cụ thể = default package + override
      const empPkg: GrossPackage = {
        ...grossPackage,
        baseSalary: emp.baseSalary,
        ...(packageOverrides[emp.id] || {}),
      };

      return calculatePayrollRecord(emp, tk, si, vi, empPkg);
    });

    const batch: PayrollBatch = {
      id: `BATCH-${month}-${year}-${Date.now()}`,
      month,
      year,
      status: 'draft',
      createdBy: currentUser.name,
      createdAt: new Date().toISOString(),
      totalEmployees: records.length,
      totalGross: records.reduce((s, r) => s + r.grossSalary, 0),
      totalNet: records.reduce((s, r) => s + r.netSalary, 0),
      totalTax: records.reduce((s, r) => s + r.pit, 0),
      totalSI: records.reduce((s, r) => s + r.siEmployee, 0),
      totalEmployerCost: records.reduce((s, r) => s + r.totalEmployerCost, 0),
      records,
    };

    setPayrollBatches((prev) => {
      const idx = prev.findIndex((b) => b.month === month && b.year === year);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = batch;
        return updated;
      }
      return [...prev, batch];
    });

    return batch;
  }, [employees, timekeeping, socialInsurance, variableIncomes, grossPackage, packageOverrides, currentUser]);

  const approveBatch = useCallback((batchId: string) => {
    setPayrollBatches((prev) =>
      prev.map((b) =>
        b.id === batchId
          ? { ...b, status: 'approved' as const, approvedBy: currentUser.name, approvedAt: new Date().toISOString() }
          : b
      )
    );
  }, [currentUser]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        switchUser,
        employees,
        setEmployees,
        timekeeping,
        setTimekeeping,
        socialInsurance,
        setSocialInsurance,
        variableIncomes,
        setVariableIncomes,
        grossPackage,
        setGrossPackage,
        packageOverrides,
        setPackageOverrides,
        payrollBatches,
        setPayrollBatches,
        generatePayroll,
        approveBatch,
        emailsSent,
        setEmailsSent,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
