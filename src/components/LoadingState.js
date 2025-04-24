import React from 'react';

const LoadingState = ({ type = 'page', text = 'Loading...' }) => {
  if (type === 'page') {
    return (
      <div className="loading-spinner-container">
        <div className="loading-spinner"></div>
        <div className="loading-spinner-text">{text}</div>
      </div>
    );
  }

  if (type === 'section') {
    return (
      <div className="skeleton-container">
        <div className="skeleton-item">
          <div className="skeleton-shimmer"></div>
        </div>
      </div>
    );
  }

  return null;
};

export default LoadingState; 