import api from './api';
import { TrainingStartResponse, TrainingStatus, ListModelsResponse, StopTrainingResponse } from '../types/api';

/**
 * Training Service
 * Handles all model training API calls
 */

/**
 * Start YOLO model training
 * @param datasetName - Name of the dataset to train on
 * @param epochs - Number of training epochs (default: 60)
 */
export const startTraining = async (
  datasetName: string,
  epochs: number = 60
): Promise<TrainingStartResponse> => {
  const response = await api.post<TrainingStartResponse>(
    `/training/start?dataset_name=${datasetName}&epochs=${epochs}`
  );
  return response.data;
};

/**
 * Get training status
 * @param datasetName - Name of the dataset being trained
 */
export const getTrainingStatus = async (
  datasetName: string
): Promise<TrainingStatus> => {
  const response = await api.get<TrainingStatus>(
    `/training/status/${datasetName}`
  );
  return response.data;
};

/**
 * List all trained models
 */
export const listTrainedModels = async (): Promise<ListModelsResponse> => {
  const response = await api.get<ListModelsResponse>('/training/list-models');
  return response.data;
};

/**
 * Stop running training
 * @param datasetName - Name of the dataset whose training should be stopped
 */
export const stopTraining = async (
  datasetName: string
): Promise<StopTrainingResponse> => {
  const response = await api.post<StopTrainingResponse>(
    `/training/stop/${datasetName}`
  );
  return response.data;
};
