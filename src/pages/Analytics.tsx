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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [error, setError] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

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

    const activeAnalysis = localStorage.getItem('activeAnalysis');
    if (activeAnalysis) {
      const { analysisId: savedAnalysisId, sessionName: savedSessionName, timestamp } = JSON.parse(activeAnalysis);
      const hoursSinceStart = (Date.now() - timestamp) / (1000 * 60 * 60);
      
      if (hoursSinceStart < 24) {
        setSelectedSession(savedSessionName);
        setAnalysisId(savedAnalysisId);
        setIsAnalyzing(true);
        
        getAnalysisStatus(savedAnalysisId).then(status => {
          if ('status' in status) {
            setAnalysisStatus(status as AnalysisStatus);
            if (status.status === 'completed' || status.status === 'error') {
              setIsAnalyzing(false);
              if (status.status === 'completed') setCompletedSession(savedSessionName);
              localStorage.removeItem('activeAnalysis');
            }
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
    if (!analysisId || !isAnalyzing) return;

    const pollStatus = async () => {
      try {
        const status = await getAnalysisStatus(analysisId);
        if ('status' in status) {
          // Εδώ αποθηκεύονται όλα τα paths των charts (pie_chart, ttff_chart, κλπ)
          setAnalysisStatus(status as AnalysisStatus);
          
          if (status.status === 'completed' || status.status === 'error') {
            setIsAnalyzing(false);
            if (status.status === 'completed') {
              setCompletedSession(selectedSession);
            }
            localStorage.removeItem('activeAnalysis');
          }
        }
      } catch (err: any) {
        setError('Failed to get analysis status');
        setIsAnalyzing(false);
      }
    };

    pollStatus();
    const interval = setInterval(pollStatus, 3000);
    return () => clearInterval(interval);
  }, [analysisId, isAnalyzing, selectedSession]);

  const handleStartAnalysis = async () => {
    if (!selectedSession) {
      setError('Please select a session');
      return;
    }
    setIsStarting(true);
    setError('');
    try {
      const response = await startAnalysis(selectedSession);
      setAnalysisId(response.analysis_id);
      setIsAnalyzing(true);
      setIsStarting(false);
      setCompletedSession(null);
      localStorage.setItem('activeAnalysis', JSON.stringify({
        analysisId: response.analysis_id,
        sessionName: selectedSession,
        timestamp: Date.now()
      }));
    } catch (err: any) {
      setError('Failed to start analysis');
      setIsStarting(false);
    }
  };

  const handleDownloadVideo = async (videoFile: string) => {
    const url = `${API_URL}/api/download?file_path=${encodeURIComponent(videoFile)}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = videoFile.split('/').pop() || 'video.mp4';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper function to get download URL
  const getDownloadUrl = (filePath: string | undefined) => {
    if (!filePath) return '#';
    return `${API_URL}/analysis/download-report?file_path=${encodeURIComponent(filePath)}`;
  };

  return (
    <div className="analytics-page">
      <div className="page-header">
        <h1>Analysis & Reports</h1>
        <p className="subtitle">Choose the session you want to analyze !!</p>
      </div>

      {error && !isAnalyzing && <div className="error-message">{error}</div>}

      {isAnalyzing && (
        <div className="active-analysis-badge">
          <span className="badge-text">
            Analysis in progress: <strong>{selectedSession}</strong>
            {analysisStatus?.percentage !== undefined && ` (${analysisStatus.percentage}%)`}
          </span>
        </div>
      )}

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
            {sessions?.map((session) => (
              <option key={session} value={session}>{session}</option>
            ))}
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

      {analysisStatus?.status === 'completed' && (
        <div className="status-card success">
          <h3>✓ Analysis Completed</h3>
          {analysisStatus.video_file && (
            <button onClick={() => handleDownloadVideo(analysisStatus.video_file!)} className="btn-primary">
              📥 Download Video
            </button>
          )}
        </div>
      )}

      {completedSession && analysisStatus?.status === 'completed' && (
        <div className="reports-container">
          <h2 className="reports-title">📊 Session Reports</h2>
          <p className="reports-subtitle">Automated visual reports for session: <strong>{completedSession}</strong></p>
          
          <div className="reports-grid">
            
            {/* 1. Report Overview (Pie Chart) */}
            <div className="report-card">
              <h3 className="report-card-title">Report Overview</h3>
              <p className="report-card-subtitle">Overview of trends in pupil behavior (Gaze Share)</p>
              <div className="report-image-wrapper" onClick={() => setSelectedImage(`${API_URL}/${analysisStatus.pie_chart}`)}>
                <img src={`${API_URL}/${analysisStatus.pie_chart}`} alt="Report Overview" className="report-image clickable" onError={(e) => e.currentTarget.style.display = 'none'} />
              </div>
              <a href={getDownloadUrl(analysisStatus.pie_chart)} className="report-download-btn">📥 Download</a>
            </div>

            {/* 2. Fixation Timeline (Updated) */}
            <div className="report-card">
              <h3 className="report-card-title">Fixation Timeline</h3>
              <p className="report-card-subtitle">Timeline Chart – Fixation events over time</p>
              <div className="report-image-wrapper" onClick={() => setSelectedImage(`${API_URL}/${analysisStatus.timeline_chart}`)}>
                <img src={`${API_URL}/${analysisStatus.timeline_chart}`} alt="Fixation Timeline" className="report-image clickable" onError={(e) => e.currentTarget.style.display = 'none'} />
              </div>
              <a href={getDownloadUrl(analysisStatus.timeline_chart)} className="report-download-btn">📥 Download</a>
            </div>

            {/* 3. Time to First Fixation (Scientific) (Updated) */}
            <div className="report-card">
              <h3 className="report-card-title">Time to First Fixation (Scientific)</h3>
              <p className="report-card-subtitle">Bar Chart – TTFF per object (scientific notation)</p>
              <div className="report-image-wrapper" onClick={() => setSelectedImage(`${API_URL}/${analysisStatus.ttff_chart}`)}>
                <img src={`${API_URL}/${analysisStatus.ttff_chart}`} alt="TTFF Scientific" className="report-image clickable" onError={(e) => e.currentTarget.style.display = 'none'} />
              </div>
              <a href={getDownloadUrl(analysisStatus.ttff_chart)} className="report-download-btn">📥 Download</a>
            </div>

            {/* 4. Pupil Dynamics (Line Chart) */}
            <div className="report-card">
              <h3 className="report-card-title">Pupil Dynamics</h3>
              <p className="report-card-subtitle">Dynamics of pupil behavior (Average Diameter)</p>
              <div className="report-image-wrapper" onClick={() => setSelectedImage(`${API_URL}/${analysisStatus.pupil_chart}`)}>
                <img src={`${API_URL}/${analysisStatus.pupil_chart}`} alt="Pupil Dynamics" className="report-image clickable" onError={(e) => e.currentTarget.style.display = 'none'} />
              </div>
              <a href={getDownloadUrl(analysisStatus.pupil_chart)} className="report-download-btn">📥 Download</a>
            </div>

            {/* 5. Dwell Time Analysis */}
            <div className="report-card">
              <h3 className="report-card-title">Dwell Time Analysis</h3>
              <p className="report-card-subtitle">Bar Chart – Total time spent on each object</p>
              <div className="report-image-wrapper" onClick={() => setSelectedImage(`${API_URL}/${analysisStatus.dwell_bar_chart}`)}>
                <img src={`${API_URL}/${analysisStatus.dwell_bar_chart}`} alt="Dwell Time" className="report-image clickable" onError={(e) => e.currentTarget.style.display = 'none'} />
              </div>
              <a href={getDownloadUrl(analysisStatus.dwell_bar_chart)} className="report-download-btn">📥 Download</a>
            </div>

            {/* 6. Pupil Fluctuations */}
            <div className="report-card">
              <h3 className="report-card-title">Pupil Fluctuations</h3>
              <p className="report-card-subtitle">Line Chart – Diameter fluctuations over time</p>
              <div className="report-image-wrapper" onClick={() => setSelectedImage(`${API_URL}/${analysisStatus.pupil_time_chart)}`)}>
                <img src={`${API_URL}/${analysisStatus.pupil_time_chart}`} alt="Pupil Fluctuations" className="report-image clickable" onError={(e) => e.currentTarget.style.display = 'none'} />
              </div>
              <a href={getDownloadUrl(analysisStatus.pupil_time_chart)} className="report-download-btn">📥 Download</a>
            </div>

            {/* 7. Mean Fixation Duration */}
            <div className="report-card">
              <h3 className="report-card-title">Mean Fixation Duration</h3>
              <p className="report-card-subtitle">Bar Chart – Average duration of gaze fixations</p>
              <div className="report-image-wrapper" onClick={() => setSelectedImage(`${API_URL}/${analysisStatus.mean_fixation}`)}>
                <img src={`${API_URL}/${analysisStatus.mean_fixation}`} alt="Mean Fixation" className="report-image clickable" onError={(e) => e.currentTarget.style.display = 'none'} />
              </div>
              <a href={getDownloadUrl(analysisStatus.mean_fixation)} className="report-download-btn">📥 Download</a>
            </div>

          </div>
        </div>
      )}
      {/* Modal για μεγέθυνση εικόνας */}
        {selectedImage && (
          <div className="image-modal-overlay" onClick={() => setSelectedImage(null)}>
            <div className="image-modal-content">
              <button className="modal-close-btn">&times;</button>
              <img src={selectedImage} alt="Enlarged Report" />
            </div>
          </div>
        )}
    </div>
  );
};

export default Analytics;
