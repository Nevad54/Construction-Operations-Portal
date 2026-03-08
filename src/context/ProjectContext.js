import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const ProjectContext = createContext();

export const useProjects = () => useContext(ProjectContext);

export const ProjectProvider = ({ children }) => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [assetBaseUrl, setAssetBaseUrl] = useState(() => api.getProjectAssetBaseUrl());

    const buildProjectLoadMessage = useCallback((err) => {
        const configuredUrl = process.env.REACT_APP_API_URL || '';
        const defaultTargets = 'http://localhost:3002 or http://localhost:3102';
        const target = configuredUrl || `the local API proxy or a backend at ${defaultTargets}`;
        const detail = String(err?.message || '').trim();

        if (/Failed to fetch|NetworkError|Load failed/i.test(detail)) {
            return `Could not reach project data. Public pages remain usable, but the backend must be running and reachable at ${target}.`;
        }

        if (/Expected JSON/i.test(detail)) {
            return `Project data responded with an unexpected format. Check that the backend or proxy is serving the projects API at ${target}.`;
        }

        return `Could not load projects. Public pages remain usable, but project data needs the backend running and reachable at ${target}.`;
    }, []);

    const fetchProjects = useCallback(async ({ quiet = false } = {}) => {
        try {
            setLoading(true);
            const allProjects = await api.getProjects();
            setProjects(allProjects);
            setAssetBaseUrl(api.getProjectAssetBaseUrl());
            setError(null);
            return allProjects;
        } catch (err) {
            setError(buildProjectLoadMessage(err));
            setAssetBaseUrl(api.getProjectAssetBaseUrl());
            setProjects([]);
            if (!quiet) {
                throw err;
            }
            return [];
        } finally {
            setLoading(false);
        }
    }, [buildProjectLoadMessage]);

    useEffect(() => {
        fetchProjects({ quiet: true });
    }, [fetchProjects]);

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

    return (
        <ProjectContext.Provider value={{
        projects,
        loading,
        error,
        assetBaseUrl,
        addProject,
        updateProject,
        deleteProject,
        refreshProjects: () => fetchProjects({ quiet: false })
        }}>
            {children}
        </ProjectContext.Provider>
    );
}; 
