import React, { useState, useEffect } from 'react';
import { listDatasets } from '../services/datasetService';
import { startTraining, getTrainingStatus, listTrainedModels, stopTraining } from '../services/trainingService';
import { TrainingStatus } from '../types/api';
import Icon from '../components/Icon';
import './TrainingCenter.css';

const TrainingCenter: React.FC = () => {
  const [datasets, setDatasets] = useState<string[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [epochs, setEpochs] = useState<number>(50);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus | null>(null);
  const [error, setError] = useState<string>('');
  const [trainedModels, setTrainedModels] = useState<string[]>([]);

  // Fetch datasets and models on mount
  useEffect(() => {
    fetchDatasets();
    fetchTrainedModels();
    
    // Check for active training in localStorage
    const activeTraining = localStorage.getItem('activeTraining');
    if (activeTraining) {
      const { dataset, epochs: savedEpochs, timestamp } = JSON.parse(activeTraining);
      
      // Check if training was started within last 24 hours (safety check)
      const hoursSinceStart = (Date.now() - timestamp) / (1000 * 60 * 60);
      if (hoursSinceStart < 24) {
        setSelectedDataset(dataset);
        setEpochs(savedEpochs);
        setIsTraining(true);
        
        // Start polling status immediately
        getTrainingStatus(dataset).then(status => {
          setTrainingStatus(status);
          if (status.status === 'completed' || status.status === 'failed') {
            setIsTraining(false);
            localStorage.removeItem('activeTraining');
          }
        }).catch(() => {
          // If status fetch fails, assume training is not active anymore
          setIsTraining(false);
          localStorage.removeItem('activeTraining');
        });
      } else {
        // Training is too old, clear it
        localStorage.removeItem('activeTraining');
      }
    }
  }, []);

  // Poll training status when training
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTraining && selectedDataset) {
      interval = setInterval(async () => {
        try {
          const status = await getTrainingStatus(selectedDataset);
          setTrainingStatus(status);
          if (status.status === 'completed' || status.status === 'failed') {
            setIsTraining(false);
            clearInterval(interval);
            // Clear active training from localStorage
            localStorage.removeItem('activeTraining');
            // Refresh models list when training completes
            if (status.status === 'completed') {
              fetchTrainedModels();
            }
          }
        } catch (err) {
          console.error('Error fetching training status:', err);
        }
      }, 4000); // Poll every 4 seconds
    }
    return () => clearInterval(interval);
  }, [isTraining, selectedDataset]);

  const fetchDatasets = async () => {
    try {
      const response = await listDatasets();
      setDatasets(response.datasets);
      if (response.datasets && response.datasets.length > 0) {
        setSelectedDataset(response.datasets[0]);
      }
    } catch (err) {
      console.error('Error fetching datasets:', err);
      setError('Failed to load datasets');
    }
  };

  const fetchTrainedModels = async () => {
    try {
      const response = await listTrainedModels();
      setTrainedModels(response.models);
    } catch (err) {
      console.error('Error fetching trained models:', err);
    }
  };

  const handleStartTraining = async () => {
    if (!selectedDataset) {
      setError('Please select a dataset');
      return;
    }

    try {
      setError('');
      setIsTraining(true);
      
      // Save active training to localStorage
      localStorage.setItem('activeTraining', JSON.stringify({
        dataset: selectedDataset,
        epochs: epochs,
        timestamp: Date.now()
      }));
      
      await startTraining(selectedDataset, epochs);
      setTrainingStatus({ status: 'running', current_epoch: 0, total_epochs: epochs });
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail 
        ? (typeof err.response.data.detail === 'string' 
            ? err.response.data.detail 
            : JSON.stringify(err.response.data.detail))
        : 'Failed to start training';
      setError(errorMessage);
      setIsTraining(false);
      localStorage.removeItem('activeTraining');
    }
  };

  const handleStopTracking = async () => {
    if (!selectedDataset) return;
    
    try {
      // Call backend to stop training
      await stopTraining(selectedDataset);
      
      // Stop tracking the training
      setIsTraining(false);
      setTrainingStatus(null);
      localStorage.removeItem('activeTraining');
      setError('');
    } catch (err: any) {
      // If training is not running or not found, just stop tracking locally
      if (err.response?.status === 400 || err.response?.status === 404) {
        setIsTraining(false);
        setTrainingStatus(null);
        localStorage.removeItem('activeTraining');
        setError('');
      } else {
        const errorMessage = err.response?.data?.detail 
          ? (typeof err.response.data.detail === 'string' 
              ? err.response.data.detail 
              : JSON.stringify(err.response.data.detail))
          : 'Failed to stop training';
        setError(errorMessage);
      }
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Training Center</h1>
        <p className="page-description">Select your prepared dataset and define the training epochs to develop a custom YOLO11 model tailored for your session environment.</p>
      </div>

      <div className="training-layout">
        {/* New Training Section */}
        <div className="new-training-container">
          <h2 className="section-title">New Training</h2>
          <div className="new-training-grid">
            {/* Hyperparameters */}
            <div className="training-card hyperparameters-card">
              <h3 className="card-title">
                <Icon name="settings" size={20} />
                Hyperparameters
              </h3>

              <div className="form-group-row">
                <div className="form-group">
                  <label className="form-label">DATASET</label>
                  <select
                    className="form-select"
                    value={selectedDataset}
                    onChange={(e) => setSelectedDataset(e.target.value)}
                    disabled={isTraining}
                  >
                    {datasets && datasets.map((dataset) => (
                      <option key={dataset} value={dataset}>
                        {dataset}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">MODEL</label>
                  <input
                    type="text"
                    className="form-input"
                    value="YOLO11s"
                    disabled
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">EPOCHS: {epochs}</label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={epochs}
                  onChange={(e) => setEpochs(Number(e.target.value))}
                  className="form-slider"
                  disabled={isTraining}
                />
              </div>

              <div className="button-group">
                <button
                  className="btn-primary"
                  onClick={handleStartTraining}
                  disabled={isTraining || !selectedDataset}
                >
                  {isTraining ? 'Training in Progress...' : 'Start Training'}
                </button>
                
                {isTraining && (
                  <button
                    className="btn-secondary"
                    onClick={handleStopTracking}
                  >
                    Stop Tracking
                  </button>
                )}
              </div>

              {error && <div className="error-message">{error}</div>}
            </div>

            {/* Active Metrics */}
            <div className="training-card metrics-card-main">
              <h3 className="card-title">
                <Icon name="analytics" size={20} />
                Active Metrics
              </h3>
              
              {isTraining && (
                <div className="active-training-badge">
                  <span className="badge-text">Training in progress: <strong>train_{selectedDataset}</strong></span>
                </div>
              )}
              
              <div className="metrics-grid-main">
                <div className="metric-item">
                  <span className="metric-label">Current Epoch</span>
                  <span className="metric-value">
                    {trainingStatus?.current_epoch || 0}
                  </span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Total Epochs</span>
                  <span className="metric-value">
                    {trainingStatus?.total_epochs || epochs}
                  </span>
                </div>
              </div>
              
              <div className="progress-section">
                <span className="metric-label">Progress</span>
                <div className="large-progress-bar">
                  <div
                    className="large-progress-fill"
                    style={{ width: `${trainingStatus?.percentage || 0}%` }}
                  >
                    <span className="progress-text">{trainingStatus?.percentage || 0}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trained Models */}
        <div className="training-card models-card">
          <h2 className="card-title">Trained Models</h2>
          <div className="models-list">
            {trainedModels && trainedModels.length > 0 ? (
              trainedModels.map((model) => (
                <div key={model} className="model-item">
                  <span className="model-icon">🤖</span>
                  <span className="model-name">{model}</span>
                </div>
              ))
            ) : (
              <div className="no-models">
                <p>No trained models yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingCenter;
