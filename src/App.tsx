import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Welcome from './pages/Welcome';
import DatasetManager from './pages/DatasetManager';
import TrainingCenter from './pages/TrainingCenter';
import VideoProcessing from './pages/VideoProcessing';
import Analytics from './pages/Analytics';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Sidebar />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/dataset-manager" element={<DatasetManager />} />
            <Route path="/training-center" element={<TrainingCenter />} />
            <Route path="/video-processing" element={<VideoProcessing />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
