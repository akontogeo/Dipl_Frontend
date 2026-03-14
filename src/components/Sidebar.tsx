import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from './Icon';
import './Sidebar.css';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'Welcome', icon: 'home' },
    { path: '/dataset-manager', label: 'Dataset Manager', icon: 'dataset' },
    { path: '/training-center', label: 'Training Center', icon: 'training' },
    { path: '/video-processing', label: 'Video Processing', icon: 'video' },
    { path: '/analytics', label: 'Analysis & Reports', icon: 'analytics' },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>GazeFlow AI</h2>
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="nav-icon">
              <Icon name={item.icon} />
            </span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="settings-link">
          <span className="nav-icon">
            <Icon name="settings" />
          </span>
          <span className="nav-label">Settings</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
