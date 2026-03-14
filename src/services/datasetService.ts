import api from './api';
import { UploadDatasetResponse, DatasetStats, ListDatasetsResponse } from '../types/api';

/**
 * Dataset Service
 * Handles all dataset-related API calls
 */

/**
 * Upload and process a dataset ZIP file
 * @param file - ZIP file containing the dataset
 * @param datasetName - Name to assign to the uploaded dataset
 * @param onProgress - Optional callback for upload progress
 */
export const uploadDataset = async (
  file: File,
  datasetName: string,
  onProgress?: (progress: number) => void
): Promise<UploadDatasetResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<UploadDatasetResponse>(
    `/dataset/upload-zip?dataset_name=${datasetName}`,
    formData,
    {
      headers: {
        
      },
      timeout: 600000, // 10 minutes for large uploads & processing
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress?.(percentCompleted);
        }
      },
    }
  );

  return response.data;
};

/**
 * List all uploaded datasets
 */
export const listDatasets = async (): Promise<ListDatasetsResponse> => {
  const response = await api.get<ListDatasetsResponse>('/dataset/list');
  return response.data;
};

/**
 * Get dataset statistics
 * @param datasetName - Name of the dataset
 */
export const getDatasetStats = async (
  datasetName: string
): Promise<DatasetStats> => {
  const response = await api.get<DatasetStats>(
    `/dataset/stats/${datasetName}`
  );
  return response.data;
};
