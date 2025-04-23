import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const ProjectContext = createContext();

export const useProjects = () => useContext(ProjectContext);

export const ProjectProvider = ({ children }) => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const allProjects = await api.getProjects();
            setProjects(allProjects);
            setError(null);
        } catch (err) {
            setError('Failed to fetch projects');
            console.error('Error fetching projects:', err);
        } finally {
            setLoading(false);
        }
    };

    const addProject = async (projectData) => {
        try {
            const newProject = await api.createProject(projectData);
            setProjects(prev => [...prev, newProject]);
            return newProject;
        } catch (err) {
            console.error('Error adding project:', err);
            throw err;
        }
    };

    const updateProject = async (id, projectData) => {
        try {
            const updatedProject = await api.updateProject(id, projectData);
            setProjects(prev => prev.map(project => 
                project._id === id ? updatedProject : project
            ));
            return updatedProject;
        } catch (err) {
            console.error('Error updating project:', err);
            throw err;
        }
    };

    const deleteProject = async (id) => {
        try {
            await api.deleteProject(id);
            setProjects(prev => prev.filter(project => project._id !== id));
        } catch (err) {
            console.error('Error deleting project:', err);
            throw err;
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const value = {
        projects,
        loading,
        error,
        addProject,
        updateProject,
        deleteProject,
        refreshProjects: fetchProjects
    };

    return (
        <ProjectContext.Provider value={value}>
            {children}
        </ProjectContext.Provider>
    );
}; 