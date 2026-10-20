import { api } from './api';

export class ReportService {
  static async createReport(data: {
    productId?: number;
    reportedUserId?: number;
    reasonCode: string;
    explanation: string;
  }) {
    const response = await api.post('/reports', data);
    return response.data;
  }
}
