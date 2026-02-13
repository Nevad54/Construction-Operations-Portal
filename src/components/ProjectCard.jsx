import React, { memo } from 'react';
import { Button } from './ui';

const ProjectCard = memo(function ProjectCard({ 
  project, 
  index, 
  section, 
  selected, 
  onSelect, 
  onEdit, 
  onDelete, 
  cardRef 
}) {
  const IMAGE_BASE_URL = process.env.REACT_APP_API_URL || '';

  const handleCardClick = (event) => {
    onSelect(section, project._id, index, event);
  };

  const handleEditClick = (event) => {
    event.stopPropagation();
    onEdit(project);
  };

  const handleDeleteClick = (event) => {
    event.stopPropagation();
    onDelete(project._id);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(section, project._id, index, event);
    }
  };

  return (
    <div
      ref={cardRef}
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      className={`
        rounded-xl border-2 overflow-hidden bg-surface-muted dark:bg-gray-800 transition-all duration-200
        hover:shadow-md cursor-pointer group
        ${selected 
          ? 'border-brand ring-2 ring-brand/20 shadow-md' 
          : 'border-transparent hover:border-stroke dark:hover:border-gray-600'
        }
      `}
      data-aos="fade-up"
      data-aos-delay={200 + index * 50}
    >
      {project.image && (
        <div className="relative overflow-hidden">
          <img
            src={`${IMAGE_BASE_URL}${project.image}`}
            alt={project.title}
            className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {selected && (
            <div className="absolute top-2 right-2 w-6 h-6 bg-brand rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>
      )}
      
      <div className="p-4">
        <h3 className="font-semibold text-text-primary dark:text-gray-100 mb-1 truncate group-hover:text-brand transition-colors">
          {project.title}
        </h3>
        <p className="text-sm text-text-secondary dark:text-gray-400 line-clamp-2 mb-3">
          {project.description}
        </p>
        
        <div className="space-y-1 mb-4">
          {project.location && (
            <p className="text-xs text-text-muted dark:text-gray-500 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {project.location}
            </p>
          )}
          {project.date && (
            <p className="text-xs text-text-muted dark:text-gray-500 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {new Date(project.date).toLocaleDateString()}
            </p>
          )}
        </div>
        
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button 
            size="sm" 
            variant="secondary"
            onClick={handleEditClick}
            className="flex-1"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </Button>
          <Button 
            size="sm" 
            variant="danger"
            onClick={handleDeleteClick}
            className="flex-1"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
});

export default ProjectCard;
