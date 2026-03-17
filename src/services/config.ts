import { api } from './api';
import type { GrossPackage } from '../types';

export const configService = {
  getGrossPackage: async (): Promise<GrossPackage> => {
    const { data } = await api.get('/config/gross-package');
    return data;
  },
};
