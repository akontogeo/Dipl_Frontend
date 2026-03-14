import React, { useState, useRef, useEffect } from 'react';
import { uploadDataset, listDatasets } from '../services';
import { Icon } from '../components/Icon';
import './DatasetManager.css';

const DatasetManager: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [datasetName, setDatasetName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | ''; text: string }>({
    type: '',
    text: '',
  });
  const [datasets, setDatasets] = useState<string[]>([]);
  const [loadingDatasets, setLoadingDatasets] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch datasets on mount
  useEffect(() => {
    fetchDatasets();
  }, []);

  // Fetch all datasets
  const fetchDatasets = async () => {
    setLoadingDatasets(true);
    try {
      const result = await listDatasets();
      setDatasets(result.datasets);
    } catch (error) {
      console.error('Failed to fetch datasets:', error);
    } finally {
      setLoadingDatasets(false);
    }
  };

  // Handle drag events
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Validate and set file
  const handleFileSelect = (file: File) => {
    // Check if file is ZIP
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setMessage({
        type: 'error',
        text: 'Only ZIP files are allowed!',
      });
      return;
    }

    setSelectedFile(file);
    setMessage({ type: '', text: '' });
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Handle click to upload
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile || !datasetName.trim()) {
      setMessage({
        type: 'error',
        text: 'Please select a file and dataset name',
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setMessage({ type: '', text: '' });

    try {
      // Upload with real progress tracking
      const result = await uploadDataset(
        selectedFile, 
        datasetName,
        (progress) => {
          // Update progress bar as file uploads
          setUploadProgress(progress);
        }
      );

      // Upload and processing complete
      setUploadProgress(100);
      setMessage({
        type: 'success',
        text: result.message,
      });

      // Refresh datasets list
      fetchDatasets();

      // Reset form after success
      setTimeout(() => {
        setSelectedFile(null);
        setDatasetName('');
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 2000);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Upload failed. Please try again.',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="dataset-header">
        <div>
          <h1>Dataset Manager</h1>
          <p>Upload and manage your training datasets.</p>
        </div>
        <button 
          className="help-button" 
          onClick={() => setShowHelpDialog(true)}
          title="Get Help"
        >
          <Icon name="help-circle" size={24} />
        </button>
      </div>

      {/* Help Dialog */}
      {showHelpDialog && (
        <div className="dialog-overlay" onClick={() => setShowHelpDialog(false)}>
          <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h2>📚 Dataset Manager Guide</h2>
              <button 
                className="dialog-close" 
                onClick={() => setShowHelpDialog(false)}
                aria-label="Close"
              >
                <Icon name="x" size={24} />
              </button>
            </div>
            <div className="dialog-body">
              <div className="help-section">
                <h3>Προετοιμασία Dataset μέσω Roboflow</h3>
                <p>Για να διασφαλίσετε ότι το dataset σας είναι πλήρως συμβατό με το GazeFlow AI, ακολουθήστε τα παρακάτω βήματα:</p>
              </div>

              <div className="help-section">
                <h3>1️⃣ Επίσκεψη στο Roboflow</h3>
                <p>Μεταβείτε στην πλατφόρμα του <strong>Roboflow</strong> για τη διαχείριση των εικόνων σας.</p>
              </div>

              <div className="help-section">
                <h3>2️⃣ Upload & Annotate</h3>
                <p>Ανεβάστε τις φωτογραφίες σας και πραγματοποιήστε το annotation (σχολιασμό) των αντικειμένων ενδιαφέροντος (π.χ. θεραπευτικά παιχνίδια, πρόσωπα), χρησιμοποιώντας και τα ενσωματωμένα AI annotation tools για μεγαλύτερη ταχύτητα.</p>
              </div>

              <div className="help-section">
                <h3>3️⃣ Export Format</h3>
                <p>Κατά την εξαγωγή (Export), επιλέξτε τη μορφή <strong>YOLOv11</strong>. Αυτή είναι η απαιτούμενη μορφή για το μοντέλο εκπαίδευσης του συστήματός μας.</p>
              </div>

              <div className="help-section">
                <h3>⚠️ Προσοχή (Σημαντικό)</h3>
                <p>Κατεβάστε το dataset σε μορφή <strong>.zip</strong>.</p>
              </div>

              <div className="help-section">
                <h3>🚫 Μην εφαρμόσετε Augmentations</h3>
                <p>Μην επιλέξετε ρυθμίσεις Augmentation (π.χ. στροφή, θόρυβο, αλλαγή φωτεινότητας) ή άλλες αυτόματες τροποποιήσεις που προσφέρει το Roboflow.</p>
                
              </div>
            </div>
            <div className="dialog-footer">
              <button className="dialog-button" onClick={() => setShowHelpDialog(false)}>
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div className="upload-section">
        <div
          className={`upload-box ${isDragging ? 'dragging' : ''} ${selectedFile ? 'has-file' : ''}`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleUploadClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
          />

          <div className="upload-icon">
            {selectedFile ? (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                <polyline points="13 2 13 9 20 9"></polyline>
              </svg>
            ) : (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            )}
          </div>

          {selectedFile ? (
            <>
              <p className="upload-text">{selectedFile.name}</p>
              <p className="upload-subtext">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </>
          ) : (
            <>
              <p className="upload-text">Click or drag file here</p>
              <p className="upload-subtext">Only .zip files allowed</p>
            </>
          )}
        </div>

        {/* Dataset Name Input */}
        {selectedFile && (
          <div className="upload-form">
            <div className="form-group">
              <label htmlFor="dataset-name">Dataset Name: <span className="required">*</span></label>
              <input
                id="dataset-name"
                type="text"
                value={datasetName}
                onChange={(e) => setDatasetName(e.target.value)}
                placeholder="Enter dataset name (e.g. retail_dataset_v1)"
                disabled={uploading}
                autoFocus
              />
            </div>

            <button
              className="upload-button"
              onClick={handleUpload}
              disabled={uploading || !datasetName.trim()}
            >
              {uploading ? 'Uploading...' : 'Upload Dataset'}
            </button>
          </div>
        )}

        {/* Progress Bar */}
        {uploading && (
          <div className="progress-container">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
              <span className="progress-text">{uploadProgress}%</span>
            </div>
            <p className="progress-status">
              {uploadProgress < 100 
                ? '📤 Uploading file...' 
                : '⚙️ Processing and augmenting dataset...'}
            </p>
          </div>
        )}

        {/* Message */}
        {message.text && (
          <div className={`message ${message.type}`}>
            {message.type === 'success' ? '✓ ' : '⚠ '}
            {message.text}
          </div>
        )}
      </div>

      {/* Dataset Table */}
      <div className="dataset-table">
        <div className="table-header">
          <h2>Uploaded Datasets ({datasets ? datasets.length : 0})</h2>
          <button className="refresh-button" onClick={fetchDatasets} disabled={loadingDatasets}>
            {loadingDatasets ? '⟳ Loading...' : '↻ Refresh'}
          </button>
        </div>

        {loadingDatasets ? (
          <div className="loading-state">
            <p>Loading datasets...</p>
          </div>
        ) : !datasets || datasets.length === 0 ? (
          <div className="empty-state">
            <p>📂 No datasets yet</p>
            <p className="empty-subtext">Upload your first dataset to get started</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>DATASET NAME</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {datasets && datasets.map((dataset) => (
                <tr key={dataset}>
                  <td>📄 {dataset}</td>
                  <td><span className="status ready">✓ Ready</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default DatasetManager;
