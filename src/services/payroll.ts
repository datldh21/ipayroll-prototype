import { api } from './api';
import type { PayrollBatch, PayrollEditableFields } from '../types';

export const payrollService = {
  getBatches: async (): Promise<PayrollBatch[]> => {
    const { data } = await api.get('/payroll/batches');
    return data;
  },
  generatePayroll: async (
    month: number,
    year: number,
    createdBy: string,
  ): Promise<PayrollBatch> => {
    const { data } = await api.post('/payroll/batches/generate', {
      month,
      year,
      createdBy,
    });
    return data;
  },
  approveBatch: async (batchId: string, approvedBy: string): Promise<void> => {
    await api.patch(`/payroll/batches/${batchId}/approve`, { approvedBy });
  },
  updateRecord: async (
    batchId: string,
    recordId: string,
    changes: PayrollEditableFields,
  ): Promise<PayrollBatch> => {
    const { data } = await api.patch(
      `/payroll/batches/${batchId}/records/${recordId}`,
      changes,
    );
    return data;
  },
};
