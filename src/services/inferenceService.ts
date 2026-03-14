import api from './api';
import { StartInferenceResponse, InferenceStatus, NotFoundStatus } from '../types/api';

/**
 * Inference Service
 * Handles video inference and object tracking
 */

/**
 * Start object tracking on video
 * @param file - Video file (.mp4)
 * @param sessionName - Name of the session to organize the data
 * @param datasetName - Name of the dataset whose trained model should be used
 */
export const startInference = async (
  file: File,
  sessionName: string,
  datasetName: string
): Promise<StartInferenceResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<StartInferenceResponse>(
    `/inference/start-tracking?session_name=${encodeURIComponent(sessionName)}&dataset_name=${encodeURIComponent(datasetName)}`,
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
 * Get inference status
 * @param videoId - UUID of the video being processed
 */
export const getInferenceStatus = async (
  videoId: string
): Promise<InferenceStatus | NotFoundStatus> => {
  const response = await api.get<InferenceStatus | NotFoundStatus>(
    `/inference/status/${videoId}`
  );
  return response.data;
};
