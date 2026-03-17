import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import {
  Employee,
  Timekeeping,
  SocialInsurance,
  VariableIncome,
  GrossPackage,
  PayrollBatch,
  PayrollRecord,
  User,
  Proposal,
  ProposalStatus,
  PayrollEditableFields,
} from '../types';
import { employeesService } from '../services/employees';
import { timekeepingService } from '../services/timekeeping';
import { socialInsuranceService } from '../services/socialInsurance';
import { variableIncomesService } from '../services/variableIncomes';
import { payrollService } from '../services/payroll';
import { proposalsService } from '../services/proposals';
import { configService } from '../services/config';

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
  payrollBatches: PayrollBatch[];
  setPayrollBatches: React.Dispatch<React.SetStateAction<PayrollBatch[]>>;
  generatePayroll: (month: number, year: number) => Promise<PayrollBatch>;
  approveBatch: (batchId: string) => Promise<void>;
  updatePayrollRecord: (
    batchId: string,
    recordId: string,
    changes: PayrollEditableFields,
  ) => Promise<void>;
  emailsSent: Record<string, boolean>;
  setEmailsSent: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  proposals: Proposal[];
  addProposal: (proposal: Omit<Proposal, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  respondProposal: (id: string, status: ProposalStatus, response: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  loadTimekeeping: (year: number, month: number) => Promise<void>;
  loadSocialInsurance: (year: number, month: number) => Promise<void>;
}

const users: User[] = [
  { id: 'U001', name: 'Nguyễn Thị Hiền', role: 'cb_specialist' },
  { id: 'U002', name: 'Trần Thị Nguyệt', role: 'manager' },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_YEAR = 2026;
const DEFAULT_MONTH = 2;

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUserIdx, setCurrentUserIdx] = useState(0);
  const currentUser = users[currentUserIdx];
  const switchUser = () => setCurrentUserIdx((i) => (i + 1) % users.length);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [timekeeping, setTimekeeping] = useState<Timekeeping[]>([]);
  const [socialInsurance, setSocialInsurance] = useState<SocialInsurance[]>([]);
  const [variableIncomes, setVariableIncomes] = useState<VariableIncome[]>([]);
  const [grossPackage, setGrossPackage] = useState<GrossPackage>({
    baseSalary: 0,
    lunch: 730_000,
    phone: 500_000,
  });
  const [payrollBatches, setPayrollBatches] = useState<PayrollBatch[]>([]);
  const [emailsSent, setEmailsSent] = useState<Record<string, boolean>>({});
  const [proposals, setProposals] = useState<Proposal[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [empRes, tkRes, siRes, viRes, batchRes, propRes, configRes] =
          await Promise.all([
            employeesService.getAll(),
            timekeepingService.getByPeriod(DEFAULT_YEAR, DEFAULT_MONTH),
            socialInsuranceService.getByPeriod(DEFAULT_YEAR, DEFAULT_MONTH),
            variableIncomesService.getByPeriod(DEFAULT_YEAR, DEFAULT_MONTH),
            payrollService.getBatches(),
            proposalsService.getAll(),
            configService.getGrossPackage(),
          ]);
        setEmployees(empRes);
        setTimekeeping(tkRes);
        setSocialInsurance(siRes);
        setVariableIncomes(viRes);
        setPayrollBatches(batchRes);
        setProposals(propRes);
        setGrossPackage((prev) => ({ ...prev, ...configRes }));
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load data');
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const addProposal = useCallback(
    async (data: Omit<Proposal, 'id' | 'createdAt' | 'status'>) => {
      const proposal = await proposalsService.create(data);
      setProposals((prev) => [proposal, ...prev]);
    },
    [],
  );

  const respondProposal = useCallback(
    async (id: string, status: ProposalStatus, response: string) => {
      await proposalsService.respond(id, status, response, currentUser.name);
      const list = await proposalsService.getAll();
      setProposals(list);
    },
    [currentUser],
  );

  const generatePayroll = useCallback(
    async (month: number, year: number): Promise<PayrollBatch> => {
      const batch = await payrollService.generatePayroll(
        month,
        year,
        currentUser.name,
      );
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
    },
    [currentUser],
  );

  const approveBatch = useCallback(async (batchId: string) => {
    await payrollService.approveBatch(batchId, currentUser.name);
    const batches = await payrollService.getBatches();
    setPayrollBatches(batches);
  }, [currentUser]);

  const updatePayrollRecord = useCallback(
    async (
      batchId: string,
      recordId: string,
      changes: PayrollEditableFields,
    ) => {
      const batch = await payrollService.updateRecord(
        batchId,
        recordId,
        changes,
      );
      setPayrollBatches((prev) =>
        prev.map((b) => (b.id === batchId ? batch : b)),
      );
    },
    [],
  );

  const loadTimekeeping = useCallback(async (year: number, month: number) => {
    try {
      const data = await timekeepingService.getByPeriod(year, month);
      setTimekeeping(data);
    } catch (err: any) {
      console.error('Failed to load timekeeping:', err);
    }
  }, []);

  const loadSocialInsurance = useCallback(async (year: number, month: number) => {
    try {
      const data = await socialInsuranceService.getByPeriod(year, month);
      setSocialInsurance(data);
    } catch (err: any) {
      console.error('Failed to load social insurance:', err);
    }
  }, []);

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
        payrollBatches,
        setPayrollBatches,
        generatePayroll,
        approveBatch,
        updatePayrollRecord,
        emailsSent,
        setEmailsSent,
        proposals,
        addProposal,
        respondProposal,
        loading,
        error,
        loadTimekeeping,
        loadSocialInsurance,
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
