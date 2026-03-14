import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import './Welcome.css';

interface GuideCard {
  id: number;
  title: string;
  description: string;
  icon: string;
  route: string;
}

const Welcome: React.FC = () => {
  const navigate = useNavigate();

  const guideCards: GuideCard[] = [
    {
      id: 1,
      title: 'Dataset Upload',
      description: 'Upload your annotated dataset in a .zip format. This data will be used to train the YOLO11 model for object detection and semantic mapping.',
      icon: 'database',
      route: '/dataset-manager'
    },
    {
      id: 2,
      title: 'Train the Model',
      description: 'Train the YOLO11 model on your custom dataset to enable precise object detection and semantic mapping for your clinical session videos.',
      icon: 'cpu',
      route: '/training-center'
    },
    {
      id: 3,
      title: 'Process Videos',
      description: 'Upload and process your raw video and gaze recordings to extract synchronized coordinate files and prepare your data for the final behavioral analysis.',
      icon: 'video',
      route: '/video-processing'
    },
    {
      id: 4,
      title: 'View Analytics',
      description: 'Complete the fusion process to view your analysis. Access automated reports that help you track progress and understand attention dynamics easily.',
      icon: 'bar-chart-2',
      route: '/analytics'
    }
  ];

  const handleGetStarted = (route: string) => {
    navigate(route);
  };

  return (
    <div className="welcome-container">
      <div className="welcome-header">
        <h1 className="welcome-title">Welcome to GazeFlow AI</h1>
        <p className="welcome-subtitle">
          Automated Framework for Semantic Gaze Mapping & Behavioral Biomarker Extraction.
          <br />
          Bridging the Semantic Gap in pediatric neurodevelopmental assessment by transforming raw eye-tracking data into objective clinical metrics.
        </p>
      </div>

      <div className="guide-cards-grid">
        {guideCards.map((card) => (
          <div key={card.id} className="guide-card">
            <div className="guide-card-icon" data-color={card.id}>
              <Icon name={card.icon} size={32} />
            </div>
            <h2 className="guide-card-title">
              {card.id}. {card.title}
            </h2>
            <p className="guide-card-description">{card.description}</p>
            <button
              className="guide-card-button"
              onClick={() => handleGetStarted(card.route)}
            >
              Get Started
              <Icon name="arrow-right" size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Welcome;
