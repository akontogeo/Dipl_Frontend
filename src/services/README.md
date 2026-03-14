# API Services

This folder contains all API service modules for interacting with the FastAPI backend.

## Structure

```
services/
├── api.ts                  # Base axios configuration
├── datasetService.ts       # Dataset management endpoints
├── trainingService.ts      # Model training endpoints
├── gazeService.ts          # Gaze data processing endpoints
├── inferenceService.ts     # Video inference endpoints
├── analysisService.ts      # Attention analysis endpoints
└── index.ts                # Central export point
```

## Usage

### Import services

```typescript
import { 
  uploadDataset, 
  getDatasetStats,
  startTraining,
  getTrainingStatus,
  processGaze,
  startInference,
  getInferenceStatus,
  startAnalysis,
  getAnalysisStatus
} from '../services';
```

### Examples

#### Upload Dataset
```typescript
const handleUpload = async (file: File) => {
  try {
    const result = await uploadDataset(file, 'my_dataset');
    console.log(result.message);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

#### Start Training
```typescript
const handleTraining = async () => {
  try {
    const result = await startTraining('my_dataset', 100);
    console.log('Training started:', result.message);
  } catch (error) {
    console.error('Training failed:', error);
  }
};
```

#### Get Training Status
```typescript
const checkStatus = async () => {
  try {
    const status = await getTrainingStatus('my_dataset');
    console.log(`Progress: ${status.percentage}%`);
  } catch (error) {
    console.error('Status check failed:', error);
  }
};
```

#### Process Gaze Data
```typescript
const handleGazeUpload = async (file: File) => {
  try {
    const result = await processGaze(file);
    console.log(`Processed ${result.records} records`);
  } catch (error) {
    console.error('Processing failed:', error);
  }
};
```

#### Start Video Inference
```typescript
const handleVideoUpload = async (file: File) => {
  try {
    const result = await startInference(file, 'my_dataset');
    console.log('Video ID:', result.video_id);
  } catch (error) {
    console.error('Inference failed:', error);
  }
};
```

#### Run Analysis
```typescript
const runAnalysis = async () => {
  try {
    const result = await startAnalysis(
      'video.mp4',
      'processed_data/gaze.csv',
      'processed_data/yolo.csv'
    );
    console.log('Analysis ID:', result.analysis_id);
  } catch (error) {
    console.error('Analysis failed:', error);
  }
};
```

## Configuration

Set the API base URL in `.env`:

```bash
REACT_APP_API_URL=http://localhost:8000
```

## Error Handling

All services use axios interceptors for error handling. Errors are automatically logged and can be caught in try-catch blocks.

## TypeScript Types

All request/response types are defined in `src/types/api.ts` for type safety.
