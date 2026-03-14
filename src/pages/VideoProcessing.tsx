import React, { useState, useEffect, useRef } from 'react';
import './VideoProcessing.css';
import { processGaze } from '../services/gazeService';
import { startInference, getInferenceStatus } from '../services/inferenceService';
import { listDatasets } from '../services/datasetService';
import { ProcessGazeResponse, StartInferenceResponse, InferenceStatus } from '../types/api';

const VideoProcessing: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [gazeFile, setGazeFile] = useState<File | null>(null);
  const [datasets, setDatasets] = useState<string[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [sessionName, setSessionName] = useState<string>('');
  
  const [videoUploading, setVideoUploading] = useState(false);
  const [gazeUploading, setGazeUploading] = useState(false);
  const [videoProcessing, setVideoProcessing] = useState(false);
  
  const [gazeResult, setGazeResult] = useState<ProcessGazeResponse | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [inferenceStatus, setInferenceStatus] = useState<InferenceStatus | null>(null);
  
  const [error, setError] = useState('');
  const videoInputRef = useRef<HTMLInputElement>(null);
  const gazeInputRef = useRef<HTMLInputElement>(null);

  // Fetch datasets on mount and check for active tracking
  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const response = await listDatasets();
        setDatasets(response.datasets);
      } catch (err: any) {
        setError('Failed to load datasets');
      }
    };
    fetchDatasets();
    
    // Check for active tracking in localStorage
    const activeTracking = localStorage.getItem('activeTracking');
    if (activeTracking) {
      const { videoId: savedVideoId, sessionName: savedSessionName, datasetName: savedDatasetName, timestamp } = JSON.parse(activeTracking);
      
      // Check if tracking was started within last 24 hours
      const hoursSinceStart = (Date.now() - timestamp) / (1000 * 60 * 60);
      if (hoursSinceStart < 24) {
        setSelectedDataset(savedDatasetName);
        setSessionName(savedSessionName);
        setVideoId(savedVideoId);
        setVideoProcessing(true);
        
        // Start polling status immediately
        getInferenceStatus(savedVideoId).then(status => {
          if ('status' in status && (status.status === 'processing' || status.status === 'completed' || status.status === 'error')) {
            const inferenceStatus: InferenceStatus = {
              status: status.status,
              progress: status.progress || 0,
              message: status.message || '',
              output_csv: status.output_csv
            };
            setInferenceStatus(inferenceStatus);
            
            if (status.status === 'completed' || status.status === 'error') {
              setVideoProcessing(false);
              localStorage.removeItem('activeTracking');
            }
          } else {
            setVideoProcessing(false);
            localStorage.removeItem('activeTracking');
          }
        }).catch(() => {
          setVideoProcessing(false);
          localStorage.removeItem('activeTracking');
        });
      } else {
        localStorage.removeItem('activeTracking');
      }
    }
  }, []);

  // Poll inference status
  useEffect(() => {
    if (!videoId || !videoProcessing) {
      console.log('Polling skipped:', { videoId, videoProcessing });
      return;
    }

    console.log('Starting polling for videoId:', videoId);

    const pollStatus = async () => {
      try {
        console.log('Polling status for videoId:', videoId);
        const status = await getInferenceStatus(videoId);
        console.log('Received status:', status);
        
        // Check if it's InferenceStatus (has 'status' field) or NotFoundStatus
        if ('status' in status && (status.status === 'processing' || status.status === 'completed' || status.status === 'error')) {
          // It's InferenceStatus - set default progress if missing
          const inferenceStatus: InferenceStatus = {
            status: status.status,
            progress: status.progress || 0,
            message: status.message || '',
            output_csv: status.output_csv
          };
          setInferenceStatus(inferenceStatus);
          
          if (status.status === 'completed' || status.status === 'error') {
            console.log('Processing completed/error, stopping poll');
            setVideoProcessing(false);
            // Clear active tracking from localStorage
            localStorage.removeItem('activeTracking');
          }
        } else {
          // NotFoundStatus - video not found
          console.log('Video not found:', status.message);
          const errorMessage = typeof status.message === 'string' 
            ? status.message 
            : JSON.stringify(status.message);
          setError(errorMessage);
          setVideoProcessing(false);
        }
      } catch (err: any) {
        console.error('Polling error:', err);
        setError('Failed to get inference status');
        setVideoProcessing(false);
      }
    };

    pollStatus();
    const interval = setInterval(pollStatus, 3000);
    return () => clearInterval(interval);
  }, [videoId, videoProcessing]);

  // Handle video file selection
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
      setError('');
    }
  };

  // Handle gaze file selection
  const handleGazeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setGazeFile(e.target.files[0]);
      setError('');
    }
  };

  // Handle video drag and drop
  const handleVideoDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setVideoFile(e.dataTransfer.files[0]);
      setError('');
    }
  };

  // Handle gaze drag and drop
  const handleGazeDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setGazeFile(e.dataTransfer.files[0]);
      setError('');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Upload video for inference
  const handleVideoUpload = async () => {
    if (!videoFile) {
      setError('Please select a video file');
      return;
    }
    if (!selectedDataset) {
      setError('Please select a dataset');
      return;
    }
    if (!sessionName) {
      setError('Please enter a session name');
      return;
    }

    setVideoUploading(true);
    setError('');

    try {
      const response = await startInference(videoFile, sessionName, selectedDataset);
      console.log('Start inference response:', response);
      console.log('Video ID:', response.video_id);
      setVideoId(response.video_id);
      setVideoProcessing(true);
      setVideoUploading(false);
      
      // Save active tracking to localStorage
      localStorage.setItem('activeTracking', JSON.stringify({
        videoId: response.video_id,
        sessionName,
        datasetName: selectedDataset,
        timestamp: Date.now()
      }));
    } catch (err: any) {
      console.error('Video upload error:', err);
      const errorMessage = err.response?.data?.detail 
        ? (typeof err.response.data.detail === 'string' 
            ? err.response.data.detail 
            : JSON.stringify(err.response.data.detail))
        : 'Failed to upload video';
      setError(errorMessage);
      setVideoUploading(false);
    }
  };

  // Upload gaze data
  const handleGazeUpload = async () => {
    if (!gazeFile) {
      setError('Please select a gaze data file');
      return;
    }
    if (!sessionName) {
      setError('Please enter a session name');
      return;
    }

    setGazeUploading(true);
    setError('');

    try {
      const response = await processGaze(gazeFile, sessionName);
      setGazeResult(response);
      setGazeUploading(false);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail 
        ? (typeof err.response.data.detail === 'string' 
            ? err.response.data.detail 
            : JSON.stringify(err.response.data.detail))
        : 'Failed to process gaze data';
      setError(errorMessage);
      setGazeUploading(false);
    }
  };

  return (
    <div className="video-processing-page">
      <div className="page-header">
        <h1>Video & Gaze Processing</h1>
        <p className="subtitle">Create a unique name for each clinical session and upload the raw video and gaze data files exported from your Tobii device to begin the automated preprocessing.</p>
      </div>

      {error && !videoProcessing && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Active Tracking Badge */}
      {videoProcessing && (
        <div className="active-tracking-badge">
          <span className="badge-text">Tracking in progress: <strong>{sessionName}</strong> (Dataset: {selectedDataset})</span>
        </div>
      )}

      {/* Dataset & Session Selection */}
      <div className="selection-grid">
        <div className="dataset-selection-container">
          <h2 className="section-title">Select Dataset</h2>
          <div className="form-group">
            <select
              value={selectedDataset}
              onChange={(e) => setSelectedDataset(e.target.value)}
              className="form-select"
              disabled={videoUploading || videoProcessing}
            >
              <option value="">Select a dataset...</option>
              {!datasets || datasets.length === 0 ? (
                <option value="" disabled>No trained models available</option>
              ) : (
                datasets.map((dataset) => (
                  <option key={dataset} value={dataset}>
                    {dataset}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        <div className="session-name-container">
          <h2 className="section-title">Session Name</h2>
          <div className="form-group">
            <input
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              className="form-input-text"
              placeholder="Enter session name..."
              disabled={videoUploading || videoProcessing}
            />
          </div>
        </div>
      </div>

      <div className="processing-container">
        <h2 className="section-title">Input Files</h2>

        <div className="upload-grid">
          {/* Gaze Upload */}
          <div className="upload-section">
            <div
              className={`upload-area ${!selectedDataset || !sessionName || videoProcessing ? 'disabled' : ''}`}
              onDrop={selectedDataset && sessionName && !videoProcessing ? handleGazeDrop : undefined}
              onDragOver={selectedDataset && sessionName && !videoProcessing ? handleDragOver : undefined}
              onClick={selectedDataset && sessionName && !videoProcessing ? () => gazeInputRef.current?.click() : undefined}
            >
              <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="upload-text">Upload Gaze Data (.csv, .xlsx)</p>
              {(!selectedDataset || !sessionName) && <p className="helper-text">Please select dataset and enter session name</p>}
              {videoProcessing && <p className="helper-text">Tracking in progress - uploads disabled</p>}
              {gazeFile && <p className="file-name">{gazeFile.name}</p>}
            </div>
            <input
              ref={gazeInputRef}
              type="file"
              accept=".txt,.csv,.xlsx"
              onChange={handleGazeFileChange}
              style={{ display: 'none' }}
              disabled={!selectedDataset || !sessionName || videoProcessing}
            />

            {gazeFile && (
              <button
                onClick={handleGazeUpload}
                disabled={gazeUploading || videoProcessing}
                className="btn-primary"
                style={{ marginTop: '1rem' }}
              >
                {gazeUploading ? 'Processing...' : 'Process Gaze Data'}
              </button>
            )}

            {/* Gaze Result */}
            {gazeResult && (
              <div className="status-card success">
                <h3>✓ Gaze Data Processed</h3>
                <p>Records: <strong>{gazeResult.records}</strong></p>
                <p>CSV File: {gazeResult.csv_name}</p>
                <p className="file-path">{gazeResult.path}</p>
              </div>
            )}
          </div>

          {/* Video Upload */}
          <div className="upload-section">
            <div
              className={`upload-area ${!selectedDataset || !sessionName || !gazeResult || videoProcessing ? 'disabled' : ''}`}
              onDrop={selectedDataset && sessionName && gazeResult && !videoProcessing ? handleVideoDrop : undefined}
              onDragOver={selectedDataset && sessionName && gazeResult && !videoProcessing ? handleDragOver : undefined}
              onClick={selectedDataset && sessionName && gazeResult && !videoProcessing ? () => videoInputRef.current?.click() : undefined}
            >
              <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="upload-text">Upload Video (.mp4, .mov)</p>
              {(!selectedDataset || !sessionName) && <p className="helper-text">Please select dataset and enter session name</p>}
              {selectedDataset && sessionName && !gazeResult && !videoProcessing && <p className="helper-text">Please upload gaze data first</p>}
              {videoProcessing && <p className="helper-text">Tracking in progress - uploads disabled</p>}
              {videoFile && <p className="file-name">{videoFile.name}</p>}
            </div>
            <input
              ref={videoInputRef}
              type="file"
              accept=".mp4,.mov"
              onChange={handleVideoFileChange}
              style={{ display: 'none' }}
              disabled={!selectedDataset || !sessionName || !gazeResult || videoProcessing}
            />

            {videoFile && (
              <button
                onClick={handleVideoUpload}
                disabled={videoUploading || videoProcessing || !selectedDataset}
                className="btn-primary"
                style={{ marginTop: '1rem' }}
              >
                {videoUploading ? 'Uploading...' : videoProcessing ? 'Tracking in Progress...' : 'Start Tracking'}
              </button>
            )}

            {/* Tracking Status */}
            {inferenceStatus && inferenceStatus.status === 'completed' && (
              <div className="status-card success">
                <h3>✓ Tracking Completed</h3>
                {inferenceStatus.message && <p className="status-message">{inferenceStatus.message}</p>}
                {inferenceStatus.output_csv && (
                  <p className="success-message">Output: {inferenceStatus.output_csv}</p>
                )}
              </div>
            )}
            
            {inferenceStatus && inferenceStatus.status === 'error' && (
              <div className="status-card" style={{ borderColor: '#ef4444', background: '#fef2f2' }}>
                <h3>Error</h3>
                {inferenceStatus.message && <p className="status-message" style={{ color: '#ef4444' }}>{inferenceStatus.message}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoProcessing;
