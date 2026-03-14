import api from './api';
import { ProcessGazeResponse, ListSessionsResponse } from '../types/api';

/**
 * Gaze Service
 * Handles gaze tracking data processing
 */

/**
 * Process gaze tracking data
 * @param file - Gaze tracking data file (.txt)
 * @param sessionName - Name of the session to organize the data
 */
export const processGaze = async (
  file: File,
  sessionName: string
): Promise<ProcessGazeResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<ProcessGazeResponse>(
    `/gaze/process-gaze?session_name=${encodeURIComponent(sessionName)}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data;
};

/**
 * List all sessions
 */
export const listSessions = async (): Promise<ListSessionsResponse> => {
  const response = await api.get<ListSessionsResponse>('/gaze/list-sessions');
  return response.data;
};
