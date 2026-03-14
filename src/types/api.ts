// API Response Types

export interface DatasetSplitStats {
  total_images: number;
  original: number;
  augmented: number;
}

export interface DatasetStats {
  dataset: string;
  stats: {
    train: DatasetSplitStats;
    valid: DatasetSplitStats;
  };
  ratio: string;
}

export interface ListDatasetsResponse {
  datasets: string[];
}

export interface UploadDatasetResponse {
  message: string;
  location: string;
}

export interface TrainingStartResponse {
  message: string;
  epochs: number;
  status: string;
}

export interface TrainingStatus {
  status: 'not_started' | 'running' | 'completed' | 'failed';
  percentage?: number;
  current_epoch?: number;
  total_epochs?: number;
}

export interface ListModelsResponse {
  models: string[];
}

export interface StopTrainingResponse {
  message: string;
  dataset_name: string;
}

export interface ProcessGazeResponse {
  status: string;
  session_name: string;
  records: number;
  csv_name: string;
  path: string;
}

export interface StartInferenceResponse {
  video_id: string;
  session_name: string;
  message: string;
}

export interface InferenceStatus {
  status: 'processing' | 'completed' | 'error';
  progress: number;
  message: string;
  output_csv?: string;
}

export interface StartAnalysisResponse {
  analysis_id: string;
  session_name: string;
  message: string;
}

export interface ListSessionsResponse {
  sessions: string[];
}

export interface AnalysisStatus {
  status: 'starting' | 'processing' | 'completed' | 'error';
  progress: number;
  message: string;
  video_file?: string;
  excel_file?: string;
  percentage?: number;
}

export interface NotFoundStatus {
  status: 'not_found';
  message: string;
}

export interface ApiError {
  detail: string;
}
