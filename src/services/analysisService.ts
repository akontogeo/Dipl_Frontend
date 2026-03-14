import api from './api';
import { StartAnalysisResponse, AnalysisStatus, NotFoundStatus } from '../types/api';

/**
 * Analysis Service
 * Handles comprehensive attention analysis
 */

/**
 * Run comprehensive attention analysis
 * @param sessionName - Name of the session containing the data
 */
export const startAnalysis = async (
  sessionName: string
): Promise<StartAnalysisResponse> => {
  const response = await api.post<StartAnalysisResponse>(
    `/analysis/run?session_name=${encodeURIComponent(sessionName)}`
  );
  return response.data;
};

/**
 * Get analysis status
 * @param analysisId - UUID of the analysis task
 */
export const getAnalysisStatus = async (
  analysisId: string
): Promise<AnalysisStatus | NotFoundStatus> => {
  const response = await api.get<AnalysisStatus | NotFoundStatus>(
    `/analysis/status/${analysisId}`
  );
  return response.data;
};
