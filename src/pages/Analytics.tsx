import React, { useState, useEffect } from 'react';
import './Analytics.css';
import { listSessions } from '../services/gazeService';
import { startAnalysis, getAnalysisStatus } from '../services/analysisService';
import { AnalysisStatus } from '../types/api';

const Analytics: React.FC = () => {
  const [sessions, setSessions] = useState<string[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [completedSession, setCompletedSession] = useState<string | null>(null);
  
  const [error, setError] = useState('');

  // Fetch sessions on mount and check for active analysis
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await listSessions();
        setSessions(response.sessions);
      } catch (err: any) {
        setError('Failed to load sessions');
      }
    };
    fetchSessions();

    // Check for active analysis in localStorage
    const activeAnalysis = localStorage.getItem('activeAnalysis');
    if (activeAnalysis) {
      const { analysisId: savedAnalysisId, sessionName: savedSessionName, timestamp } = JSON.parse(activeAnalysis);
      
      // Check if analysis was started within last 24 hours
      const hoursSinceStart = (Date.now() - timestamp) / (1000 * 60 * 60);
      if (hoursSinceStart < 24) {
        setSelectedSession(savedSessionName);
        setAnalysisId(savedAnalysisId);
        setIsAnalyzing(true);
        
        // Start polling status immediately
        getAnalysisStatus(savedAnalysisId).then(status => {
          if ('status' in status && (status.status === 'processing' || status.status === 'completed' || status.status === 'error')) {
            const analysisStatus: AnalysisStatus = {
              status: status.status,
              progress: status.progress || 0,
              percentage: typeof status.percentage === 'number' ? status.percentage : undefined,
              message: status.message || '',
              video_file: status.video_file,
              excel_file: status.excel_file
            };
            setAnalysisStatus(analysisStatus);
            
            if (status.status === 'completed' || status.status === 'error') {
              setIsAnalyzing(false);
              localStorage.removeItem('activeAnalysis');
            }
          } else {
            setIsAnalyzing(false);
            localStorage.removeItem('activeAnalysis');
          }
        }).catch(() => {
          setIsAnalyzing(false);
          localStorage.removeItem('activeAnalysis');
        });
      } else {
        localStorage.removeItem('activeAnalysis');
      }
    }
  }, []);

  // Poll analysis status
  useEffect(() => {
    if (!analysisId || !isAnalyzing) {
      console.log('Polling skipped - analysisId:', analysisId, 'isAnalyzing:', isAnalyzing);
      return;
    }

    console.log('Starting polling for analysisId:', analysisId);

    const pollStatus = async () => {
      try {
        console.log('Polling status for analysisId:', analysisId);
        const status = await getAnalysisStatus(analysisId);
        console.log('Received status:', JSON.stringify(status, null, 2));
        
        // Check if it's AnalysisStatus (has 'status' field) or NotFoundStatus
        if ('status' in status && (status.status === 'starting' || status.status === 'processing' || status.status === 'completed' || status.status === 'error')) {
          // It's AnalysisStatus - set default progress if missing, include percentage
          const analysisStatus: AnalysisStatus = {
            status: status.status,
            progress: status.progress || 0,
            percentage: typeof status.percentage === 'number' ? status.percentage : undefined,
            message: status.message || '',
            video_file: status.video_file,
            excel_file: status.excel_file
          };
          setAnalysisStatus(analysisStatus);
          
          if (status.status === 'completed' || status.status === 'error') {
            console.log('Analysis completed/error, stopping poll');
            setIsAnalyzing(false);
            if (status.status === 'completed') {
              setCompletedSession(selectedSession);
            }
            // Clear active analysis from localStorage
            localStorage.removeItem('activeAnalysis');
          }
        } else {
          // NotFoundStatus or unknown response
          console.log('Unknown status response:', JSON.stringify(status, null, 2));
          const errorMessage = status.message 
            ? (typeof status.message === 'string' ? status.message : JSON.stringify(status.message))
            : 'Unknown analysis status';
          setError(errorMessage);
          setIsAnalyzing(false);
          localStorage.removeItem('activeAnalysis');
        }
      } catch (err: any) {
        console.error('Polling error:', err);
        setError('Failed to get analysis status');
        setIsAnalyzing(false);
        localStorage.removeItem('activeAnalysis');
      }
    };

    pollStatus();
    const interval = setInterval(pollStatus, 3000);
    return () => clearInterval(interval);
  }, [analysisId, isAnalyzing]);

  // Handle analysis start
  const handleStartAnalysis = async () => {
    if (!selectedSession) {
      setError('Please select a session');
      return;
    }

    setIsStarting(true);
    setError('');

    try {
      const response = await startAnalysis(selectedSession);
      console.log('Start analysis response:', JSON.stringify(response, null, 2));
      console.log('Analysis ID:', response.analysis_id);
      setAnalysisId(response.analysis_id);
      setIsAnalyzing(true);
      setIsStarting(false);
      setCompletedSession(null);
      
      // Save active analysis to localStorage
      localStorage.setItem('activeAnalysis', JSON.stringify({
        analysisId: response.analysis_id,
        sessionName: selectedSession,
        timestamp: Date.now()
      }));
    } catch (err: any) {
      console.error('Analysis start error:', err);
      const errorMessage = err.response?.data?.detail 
        ? (typeof err.response.data.detail === 'string' 
            ? err.response.data.detail 
            : JSON.stringify(err.response.data.detail))
        : 'Failed to start analysis';
      setError(errorMessage);
      setIsStarting(false);
    }
  };

  // Handle video download
  const handleDownloadVideo = async (videoFile: string) => {
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    const url = `${API_BASE_URL}/api/download?file_path=${encodeURIComponent(videoFile)}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = videoFile.split('/').pop() || 'video.mp4';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="analytics-page">
      <div className="page-header">
        <h1>Analysis & Reports</h1>
        <p className="subtitle">Choose the session you want to analyze !!</p>
      </div>

      {error && !isAnalyzing && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Active Analysis Badge */}
      {isAnalyzing && (
        <div className="active-analysis-badge">
          <span className="badge-text">
            Analysis in progress: <strong>{selectedSession}</strong>
            {analysisStatus && typeof analysisStatus.percentage === 'number' ? ` (${analysisStatus.percentage}%)` : ''}
          </span>
        </div>
      )}

      {/* Session & Video Selection */}
      <div className="selection-container">
        <h2 className="section-title">Analysis Configuration</h2>
        
        <div className="form-group">
          <label className="form-label">Select Session</label>
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="form-select"
            disabled={isStarting || isAnalyzing}
          >
            <option value="">Select a session...</option>
            {!sessions || sessions.length === 0 ? (
              <option value="" disabled>No sessions available</option>
            ) : (
              sessions.map((session) => (
                <option key={session} value={session}>
                  {session}
                </option>
              ))
            )}
          </select>
        </div>

        <button
          onClick={handleStartAnalysis}
          disabled={isStarting || isAnalyzing || !selectedSession}
          className="btn-primary"
          style={{ marginTop: '1.5rem' }}
        >
          {isStarting ? 'Starting...' : isAnalyzing ? 'Analysis in Progress...' : 'Run Analysis'}
        </button>
      </div>

      {/* Analysis Status */}
      {analysisStatus && analysisStatus.status === 'completed' && (
        <div className="status-card success">
          <h3>✓ Analysis Completed</h3>
          {analysisStatus.message && <p className="status-message">{analysisStatus.message}</p>}
          {analysisStatus.video_file && (
            <div className="success-message">
              <button 
                onClick={() => handleDownloadVideo(analysisStatus.video_file!)}
                style={{ 
                  display: 'inline-block',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#2c4773',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                📥 Download Video
              </button>
            </div>
          )}

        </div>
      )}

      {/* Report Charts */}
      {completedSession && analysisStatus?.status === 'completed' && (
        <div className="reports-container">
          <h2 className="reports-title">📊 Session Reports</h2>
          <p className="reports-subtitle">Automated visual reports for session: <strong>{completedSession}</strong></p>
          <div className="reports-grid">
            <div className="report-card">
              <h3 className="report-card-title">Attention Distribution</h3>
              <p className="report-card-subtitle">Pie Chart – Object gaze share</p>
              <div className="report-image-wrapper">
                <img
                  src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/outputs/sessions/${encodeURIComponent(completedSession)}/report_pie.png`}
                  alt="Pie Chart Report"
                  className="report-image"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
              <a
                href={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/analysis/download-report?file_path=outputs/sessions/${encodeURIComponent(completedSession)}/report_pie.png`}
                download={`${completedSession}_pie_chart.png`}
                className="report-download-btn"
              >
                📥 Download
              </a>
            </div>

            <div className="report-card">
              <h3 className="report-card-title">Gaze Duration per Object</h3>
              <p className="report-card-subtitle">Bar Chart – Time spent per object</p>
              <div className="report-image-wrapper">
                <img
                  src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/outputs/sessions/${encodeURIComponent(completedSession)}/report_duration.png`}
                  alt="Duration Bar Chart Report"
                  className="report-image"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
              <a
                href={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/analysis/download-report?file_path=outputs/sessions/${encodeURIComponent(completedSession)}/report_duration.png`}
                download={`${completedSession}_duration_chart.png`}
                className="report-download-btn"
              >
                📥 Download
              </a>
            </div>

            <div className="report-card">
              <h3 className="report-card-title">Time to First Fixation</h3>
              <p className="report-card-subtitle">Bar Chart – TTFF per object</p>
              <div className="report-image-wrapper">
                <img
                  src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/outputs/sessions/${encodeURIComponent(completedSession)}/report_ttff.png`}
                  alt="TTFF Bar Chart Report"
                  className="report-image"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
              <a
                href={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/analysis/download-report?file_path=outputs/sessions/${encodeURIComponent(completedSession)}/report_ttff.png`}
                download={`${completedSession}_ttff_chart.png`}
                className="report-download-btn"
              >
                📥 Download
              </a>
            </div>

            <div className="report-card">
              <h3 className="report-card-title">Pupil Size Over Time</h3>
              <p className="report-card-subtitle">Line Chart – Pupil diameter</p>
              <div className="report-image-wrapper">
                <img
                  src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/outputs/sessions/${encodeURIComponent(completedSession)}/report_pupil.png`}
                  alt="Pupil Size Chart Report"
                  className="report-image"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
              <a
                href={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/analysis/download-report?file_path=outputs/sessions/${encodeURIComponent(completedSession)}/report_pupil.png`}
                download={`${completedSession}_pupil_chart.png`}
                className="report-download-btn"
              >
                📥 Download
              </a>
            </div>
          </div>
        </div>
      )}
      
      {analysisStatus && analysisStatus.status === 'error' && (
        <div className="status-card" style={{ borderColor: '#ef4444', background: '#fef2f2' }}>
          <h3>Error</h3>
          {analysisStatus.message && <p className="status-message" style={{ color: '#ef4444' }}>{analysisStatus.message}</p>}
        </div>
      )}

      {/* Analysis Progress */}
      
    </div>
  );
};

export default Analytics;
